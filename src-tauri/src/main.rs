// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command

#[tauri::command]
fn is_ffmpeg_installed() -> bool {
    return ffmpeg_sidecar::command::ffmpeg_is_installed();
}

#[tauri::command(async)]
fn install_ffmpeg() {
    ffmpeg_sidecar::download::auto_download().unwrap();
}


fn main() {
    tauri::Builder::default()
        .setup(|app| {
            // automatically open devtools in debug builds
            #[cfg(debug_assertions)]
            {
                let window = app.get_window("main").unwrap();
                window.open_devtools();
                window.close_devtools();
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            is_ffmpeg_installed,
            install_ffmpeg,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
