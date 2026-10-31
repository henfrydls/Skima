//! Saving a backup through the native "Save as" dialog.
//!
//! Two steps so the location is chosen before the server exports: cancelling the
//! dialog then costs nothing. The webview records the outcome after write_backup
//! returns, so a failed write is never recorded as a backup. The chosen path stays
//! on this side; the webview only gets its display form and can never name a path to
//! write to, so these commands cannot be used to write an arbitrary file.

use std::fs::{self, File};
use std::io::{self, Write};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;
use tauri::{AppHandle, State, WebviewWindow};
use tauri_plugin_dialog::DialogExt;

#[derive(Default)]
pub struct PendingBackupPath {
    path: Mutex<Option<PathBuf>>,
    // One dialog at a time: a second one would overwrite the path the first chose.
    dialog_open: AtomicBool,
}

/// Clears dialog_open however the dialog ends.
struct DialogOpen<'a>(&'a AtomicBool);

impl<'a> DialogOpen<'a> {
    fn claim(flag: &'a AtomicBool) -> Option<Self> {
        flag.compare_exchange(false, true, Ordering::AcqRel, Ordering::Acquire)
            .ok()
            .map(|_| DialogOpen(flag))
    }
}

impl Drop for DialogOpen<'_> {
    fn drop(&mut self) {
        self.0.store(false, Ordering::Release);
    }
}

/// Asks where to save. Returns the chosen path for display, or None if cancelled.
#[tauri::command]
pub async fn choose_backup_path(
    app: AppHandle,
    window: WebviewWindow,
    pending: State<'_, PendingBackupPath>,
    file_name: String,
) -> Result<Option<String>, String> {
    let _open = DialogOpen::claim(&pending.dialog_open)
        .ok_or_else(|| "a save dialog is already open".to_string())?;

    // Off the main thread (async command), which the blocking dialog requires.
    // Parented to the window so it stays in front of it (Windows) and is modal.
    let picked = app
        .dialog()
        .file()
        .set_parent(&window)
        .set_file_name(&file_name)
        .add_filter("Skima backup", &["json"])
        .blocking_save_file();

    let path = match picked {
        Some(file) => Some(file.into_path().map_err(|e| e.to_string())?),
        None => None,
    };
    let shown = path.as_ref().map(|p| p.display().to_string());
    *pending.path.lock().map_err(|e| e.to_string())? = path;
    Ok(shown)
}

/// Writes the backup to the path chosen in the last dialog, once.
#[tauri::command]
pub async fn write_backup(
    pending: State<'_, PendingBackupPath>,
    contents: String,
) -> Result<(), String> {
    let path = pending
        .path
        .lock()
        .map_err(|e| e.to_string())?
        .take()
        .ok_or_else(|| "no backup location was chosen".to_string())?;
    write_atomically(&path, contents.as_bytes()).map_err(|e| format!("{}: {e}", path.display()))
}

/// Writes to a temporary file next to the target, then renames it over the target.
/// A failure part-way (disk full, drive removed) leaves an existing backup at that
/// path whole instead of truncated.
fn write_atomically(path: &Path, contents: &[u8]) -> io::Result<()> {
    let name = path
        .file_name()
        .ok_or_else(|| io::Error::new(io::ErrorKind::InvalidInput, "not a file path"))?;
    let mut tmp_name = std::ffi::OsString::from(".");
    tmp_name.push(name);
    tmp_name.push(format!(".{}.tmp", std::process::id()));
    let tmp = path.with_file_name(tmp_name);

    let result = (|| {
        let mut file = File::create(&tmp)?;
        file.write_all(contents)?;
        file.sync_all()?;
        drop(file);
        fs::rename(&tmp, path)
    })();
    if result.is_err() {
        let _ = fs::remove_file(&tmp);
    }
    result
}

#[cfg(test)]
mod tests {
    use super::{write_atomically, DialogOpen, PendingBackupPath};
    use std::fs;
    use std::path::PathBuf;

    fn scratch(name: &str) -> PathBuf {
        let dir =
            std::env::temp_dir().join(format!("skima-backup-test-{}-{name}", std::process::id()));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    fn leftovers(dir: &PathBuf) -> Vec<String> {
        fs::read_dir(dir)
            .unwrap()
            .map(|e| e.unwrap().file_name().to_string_lossy().into_owned())
            .filter(|n| n.ends_with(".tmp"))
            .collect()
    }

    #[test]
    fn nothing_is_pending_until_a_location_is_chosen() {
        let pending = PendingBackupPath::default();
        assert!(pending.path.lock().unwrap().is_none());
    }

    #[test]
    fn a_chosen_location_is_used_once() {
        let pending = PendingBackupPath::default();
        *pending.path.lock().unwrap() = Some("/tmp/x.json".into());
        assert!(pending.path.lock().unwrap().take().is_some());
        assert!(pending.path.lock().unwrap().take().is_none());
    }

    #[test]
    fn only_one_dialog_at_a_time() {
        let pending = PendingBackupPath::default();
        let first = DialogOpen::claim(&pending.dialog_open);
        assert!(first.is_some());
        assert!(DialogOpen::claim(&pending.dialog_open).is_none());
        drop(first);
        assert!(DialogOpen::claim(&pending.dialog_open).is_some());
    }

    #[test]
    fn writes_a_new_backup() {
        let dir = scratch("new");
        let path = dir.join("b.json");
        write_atomically(&path, b"{\"a\":1}").unwrap();
        assert_eq!(fs::read_to_string(&path).unwrap(), "{\"a\":1}");
        assert!(leftovers(&dir).is_empty());
    }

    #[test]
    fn replaces_an_existing_backup() {
        let dir = scratch("replace");
        let path = dir.join("b.json");
        fs::write(&path, "old").unwrap();
        write_atomically(&path, b"new").unwrap();
        assert_eq!(fs::read_to_string(&path).unwrap(), "new");
        assert!(leftovers(&dir).is_empty());
    }

    #[test]
    fn a_failed_write_leaves_what_was_there_and_no_temp_file() {
        // The rename cannot replace a non-empty directory: the write fails after the
        // temporary file is complete, the way a late failure would.
        let dir = scratch("fail");
        let path = dir.join("b.json");
        fs::create_dir(&path).unwrap();
        fs::write(path.join("keep"), "kept").unwrap();
        assert!(write_atomically(&path, b"new").is_err());
        assert_eq!(fs::read_to_string(path.join("keep")).unwrap(), "kept");
        assert!(leftovers(&dir).is_empty());
    }

    #[test]
    fn a_missing_folder_is_an_error() {
        let dir = scratch("missing");
        assert!(write_atomically(&dir.join("gone").join("b.json"), b"x").is_err());
    }
}
