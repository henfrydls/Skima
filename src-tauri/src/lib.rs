use std::net::TcpStream;
use std::sync::Mutex;
use std::time::Duration;
use tauri::{AppHandle, Manager, State};
use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::CommandChild;

mod backup;
mod packaging;
mod webview2;

/// Holds the sidecar child process so we can kill it on exit
struct SidecarState(Mutex<Option<CommandChild>>);

const SIDECAR_PORT: u16 = 11420;

/// Stop the sidecar right before the updater installs.
///
/// Auto-update on Windows fails with "Error opening file for writing" if
/// `skima-server.exe` is still alive when NSIS tries to overwrite it. The
/// app's normal exit handler kills the sidecar, but `kill()` only sends a
/// signal — Windows takes a few hundred ms to actually release the file lock,
/// and the installer doesn't wait that long.
///
/// The frontend calls this after the update is downloaded and right before it
/// is installed, and calls `restart_sidecar` if the install then fails.
#[tauri::command]
async fn prepare_for_update(state: State<'_, SidecarState>) -> Result<(), String> {
    // Take ownership of the child so the Exit handler doesn't try to kill it again
    let child = state.0.lock().unwrap().take();
    if let Some(child) = child {
        let _ = child.kill();
    }
    // Give Windows ~1.5s to flush handles and release the file lock on
    // skima-server.exe before the installer overwrites it.
    if cfg!(target_os = "windows") {
        tauri::async_runtime::spawn_blocking(|| std::thread::sleep(Duration::from_millis(1500)))
            .await
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Start the sidecar again after `prepare_for_update` when the install did not go
/// through, so the app keeps working. Does nothing while one is running.
#[tauri::command]
async fn restart_sidecar(app: AppHandle) -> Result<(), String> {
    if app.state::<SidecarState>().0.lock().unwrap().is_some() {
        return Ok(());
    }
    start_sidecar(&app)?;
    let ready = tauri::async_runtime::spawn_blocking(|| wait_for_sidecar(SIDECAR_PORT, 30))
        .await
        .map_err(|e| e.to_string())?;
    if ready {
        Ok(())
    } else {
        Err("the local server did not start".into())
    }
}

/// Spawn the sidecar, log its output, and keep its handle for shutdown.
fn start_sidecar(app: &AppHandle) -> Result<(), String> {
    let db_path = get_db_path(app)?;
    let port = SIDECAR_PORT.to_string();

    println!("[Skima] DB path: {}", db_path);
    println!("[Skima] Starting sidecar on port {}", port);

    // Detect install source for the anonymous check-in
    let install_source = packaging::detect_install_source();
    let is_store = packaging::is_msix();

    println!("[Skima] Install source: {}", install_source);

    let mut sidecar_args = vec![
        "--db-path".to_string(),
        db_path,
        "--port".to_string(),
        port,
        "--install-source".to_string(),
        install_source.to_string(),
    ];
    if is_store {
        sidecar_args.push("--store-install".to_string());
    }

    let (mut rx, child) = app
        .shell()
        .sidecar("skima-server")
        .map_err(|e| e.to_string())?
        .args(&sidecar_args)
        .spawn()
        .map_err(|e| e.to_string())?;

    // Log sidecar stdout/stderr
    tauri::async_runtime::spawn(async move {
        use tauri_plugin_shell::process::CommandEvent;
        while let Some(event) = rx.recv().await {
            match event {
                CommandEvent::Stdout(line) => {
                    let line = String::from_utf8_lossy(&line);
                    println!("[Sidecar] {}", line);
                }
                CommandEvent::Stderr(line) => {
                    let line = String::from_utf8_lossy(&line);
                    eprintln!("[Sidecar ERR] {}", line);
                }
                CommandEvent::Terminated(payload) => {
                    println!(
                        "[Sidecar] Process terminated with code: {:?}, signal: {:?}",
                        payload.code, payload.signal
                    );
                }
                _ => {}
            }
        }
    });

    // Store child handle for cleanup
    *app.state::<SidecarState>().0.lock().unwrap() = Some(child);
    Ok(())
}

/// Wait for the sidecar to start accepting TCP connections
fn wait_for_sidecar(port: u16, max_seconds: u32) -> bool {
    let addr = format!("127.0.0.1:{}", port);
    for attempt in 1..=max_seconds {
        if let Ok(stream) =
            TcpStream::connect_timeout(&addr.parse().unwrap(), Duration::from_millis(500))
        {
            drop(stream);
            println!(
                "[Skima] Sidecar ready (attempt {}/{})",
                attempt, max_seconds
            );
            return true;
        }
        std::thread::sleep(Duration::from_secs(1));
    }
    eprintln!(
        "[Skima] WARNING: Sidecar not ready after {} seconds",
        max_seconds
    );
    false
}

/// Get the app data directory path for the SQLite database
fn get_db_path(app: &AppHandle) -> Result<String, String> {
    let app_data = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("failed to resolve app data dir: {e}"))?;

    // Ensure directory exists
    std::fs::create_dir_all(&app_data)
        .map_err(|e| format!("failed to create app data dir: {e}"))?;

    let db_path = app_data.join("skima.db");
    Ok(db_path.to_string_lossy().to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Store copy only: the NSIS installer installs WebView2, and a false positive there
    // would stop working installs from opening. Before the builder: no window exists yet.
    #[cfg(target_os = "windows")]
    if packaging::is_msix() && webview2::is_missing() {
        webview2::explain_and_exit();
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            prepare_for_update,
            restart_sidecar,
            backup::choose_backup_path,
            backup::write_backup
        ])
        .manage(SidecarState(Mutex::new(None)))
        .manage(backup::PendingBackupPath::default())
        .setup(|app| {
            start_sidecar(app.handle()).expect("failed to start sidecar");

            // Wait for sidecar to accept connections before showing UI
            wait_for_sidecar(SIDECAR_PORT, 30);

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building Skima")
        .run(|app, event| {
            if let tauri::RunEvent::Exit = event {
                // Graceful shutdown: kill the sidecar process
                let state: tauri::State<SidecarState> = app.state();
                let child = state.0.lock().unwrap().take();
                if let Some(child) = child {
                    println!("[Skima] Shutting down sidecar...");
                    let _ = child.kill();
                }
            }
        });
}
