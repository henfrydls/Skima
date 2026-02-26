use std::sync::Mutex;
use std::net::TcpStream;
use std::time::Duration;
use tauri::Manager;
use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::CommandChild;

/// Holds the sidecar child process so we can kill it on exit
struct SidecarState(Mutex<Option<CommandChild>>);

/// Wait for the sidecar to start accepting TCP connections
fn wait_for_sidecar(port: u16, max_seconds: u32) -> bool {
    let addr = format!("127.0.0.1:{}", port);
    for attempt in 1..=max_seconds {
        if let Ok(stream) = TcpStream::connect_timeout(
            &addr.parse().unwrap(),
            Duration::from_millis(500),
        ) {
            drop(stream);
            println!("[Skima] Sidecar ready (attempt {}/{})", attempt, max_seconds);
            return true;
        }
        std::thread::sleep(Duration::from_secs(1));
    }
    eprintln!("[Skima] WARNING: Sidecar not ready after {} seconds", max_seconds);
    false
}

/// Get the app data directory path for the SQLite database
fn get_db_path(app: &tauri::App) -> String {
    let app_data = app
        .path()
        .app_data_dir()
        .expect("failed to resolve app data dir");

    // Ensure directory exists
    std::fs::create_dir_all(&app_data).expect("failed to create app data dir");

    let db_path = app_data.join("skima.db");
    db_path.to_string_lossy().to_string()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(SidecarState(Mutex::new(None)))
        .setup(|app| {
            let db_path = get_db_path(app);
            let port = "11420";

            println!("[Skima] DB path: {}", db_path);
            println!("[Skima] Starting sidecar on port {}", port);

            // Spawn the sidecar backend
            let sidecar = app
                .shell()
                .sidecar("skima-server")
                .expect("failed to create sidecar command")
                .args(["--db-path", &db_path, "--port", port]);

            let (mut rx, child) = sidecar.spawn().expect("failed to spawn sidecar");

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
            let state = app.state::<SidecarState>();
            *state.0.lock().unwrap() = Some(child);

            // Wait for sidecar to accept connections before showing UI
            let port_num: u16 = port.parse().unwrap();
            wait_for_sidecar(port_num, 30);

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
