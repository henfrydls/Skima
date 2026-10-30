//! Saving a backup through the native "Save as" dialog.
//!
//! Two steps so the location is chosen before the server exports (and records the export):
//! cancelling the dialog then leaves no backup recorded that does not exist. The chosen
//! path stays on this side; the webview only gets its display form and can never name a
//! path to write to, so these commands cannot be used to write an arbitrary file.

use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{AppHandle, State};
use tauri_plugin_dialog::DialogExt;

#[derive(Default)]
pub struct PendingBackupPath(Mutex<Option<PathBuf>>);

/// Asks where to save. Returns the chosen path for display, or None if cancelled.
#[tauri::command]
pub async fn choose_backup_path(
    app: AppHandle,
    pending: State<'_, PendingBackupPath>,
    file_name: String,
) -> Result<Option<String>, String> {
    // Off the main thread (async command), which the blocking dialog requires.
    let picked = app
        .dialog()
        .file()
        .set_file_name(&file_name)
        .add_filter("Skima backup", &["json"])
        .blocking_save_file();

    let path = match picked {
        Some(file) => Some(file.into_path().map_err(|e| e.to_string())?),
        None => None,
    };
    let shown = path.as_ref().map(|p| p.display().to_string());
    *pending.0.lock().map_err(|e| e.to_string())? = path;
    Ok(shown)
}

/// Writes the backup to the path chosen in the last dialog, once.
#[tauri::command]
pub async fn write_backup(
    pending: State<'_, PendingBackupPath>,
    contents: String,
) -> Result<(), String> {
    let path = pending
        .0
        .lock()
        .map_err(|e| e.to_string())?
        .take()
        .ok_or_else(|| "no backup location was chosen".to_string())?;
    std::fs::write(&path, contents).map_err(|e| format!("{}: {e}", path.display()))
}

#[cfg(test)]
mod tests {
    use super::PendingBackupPath;

    #[test]
    fn nothing_is_pending_until_a_location_is_chosen() {
        let pending = PendingBackupPath::default();
        assert!(pending.0.lock().unwrap().is_none());
    }

    #[test]
    fn a_chosen_location_is_used_once() {
        let pending = PendingBackupPath::default();
        *pending.0.lock().unwrap() = Some("/tmp/x.json".into());
        assert!(pending.0.lock().unwrap().take().is_some());
        assert!(pending.0.lock().unwrap().take().is_none());
    }
}
