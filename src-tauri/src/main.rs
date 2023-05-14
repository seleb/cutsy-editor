// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command

use std::path::Path;
use tauri::Manager;
use ffmpeg_sidecar::{command::FfmpegCommand, event::{FfmpegEvent, LogLevel}};

#[tauri::command]
fn is_ffmpeg_installed() -> bool {
    return ffmpeg_sidecar::command::ffmpeg_is_installed();
}

#[tauri::command(async)]
fn install_ffmpeg() {
    ffmpeg_sidecar::download::auto_download().unwrap();
}

#[tauri::command(async)]
fn vid_to_img(input: String, output: String, time: String) -> Result<(), String> {
    let path_input = Path::new(&input);
    let path_output = Path::new(&output);
    if !path_input.exists() {
        return Err("Source video does not exist".into());
    }

    let mut errors: Vec<String> = vec![];
    FfmpegCommand::new()
    // allow overwriting
    .overwrite()
    // no audio
    .no_audio()
    // no vysnc
    .arg("-vsync").arg(0.to_string())
    // seek
    .arg("-ss").arg(time)
    // input
    .input(path_input.as_os_str().to_str().unwrap())
    // one image
    .arg("-update").arg(1.to_string())
    .arg("-frames:v").arg(1.to_string())
    // lossless
    .arg("-lossless").arg(1.to_string())
    .arg("-compression_level").arg(6.to_string())
    .arg("-quality").arg(100.to_string())
    .arg("-qscale").arg(100.to_string())
    .arg("-qmin").arg(1.to_string())
    .arg("-q:v").arg(1.to_string())
    // output
    .output(path_output.as_os_str().to_str().unwrap())
    .spawn()
    .unwrap()
    .iter()
    .unwrap()
    .for_each(|e| match e {
        // FfmpegEvent::Log(LogLevel::Unknown, e) => println!("Unknown: {}", e),
        // FfmpegEvent::Log(LogLevel::Info, e) => println!("Info: {}", e),
        // FfmpegEvent::Log(LogLevel::Warning, e) => println!("Warning: {}", e),
        FfmpegEvent::Log(LogLevel::Error, e) => errors.push(e.clone()),
        FfmpegEvent::Log(LogLevel::Fatal, e) => errors.push(e.clone()),
        // FfmpegEvent::Progress(p) => println!("Progress: {} / 00:00:15", p.time),
      _ => {}
    });

    if errors.len() > 0 {
        return Err(errors.join("; ".into()));
    }
    Ok(())
}

#[tauri::command(async)]
fn vid_to_clip(input: String, output: String, start: String, duration: String, audio: bool) -> Result<(), String> {
    let path_input = Path::new(&input);
    let path_output = Path::new(&output);
    if !path_input.exists() {
        return Err("Source video does not exist".into());
    }

    let mut errors: Vec<String> = vec![];
    let mut command = FfmpegCommand::new();

    command
    // allow overwriting
    .overwrite();

    // no audio
    if !audio {
        command.no_audio();
    }

    command
    // no vysnc
    .arg("-vsync").arg(0.to_string())
    // seek
    .arg("-ss").arg(start)
    // duration
    .duration(duration)
    // input
    .input(path_input.as_os_str().to_str().unwrap())
    // output
    .output(path_output.as_os_str().to_str().unwrap())
    .spawn()
    .unwrap()
    .iter()
    .unwrap()
    .for_each(|e| match e {
        // FfmpegEvent::Log(LogLevel::Unknown, e) => println!("Unknown: {}", e),
        // FfmpegEvent::Log(LogLevel::Info, e) => println!("Info: {}", e),
        // FfmpegEvent::Log(LogLevel::Warning, e) => println!("Warning: {}", e),
        FfmpegEvent::Log(LogLevel::Error, e) => errors.push(e.clone()),
        FfmpegEvent::Log(LogLevel::Fatal, e) => errors.push(e.clone()),
        // FfmpegEvent::Progress(p) => println!("Progress: {} / 00:00:15", p.time),
      _ => {}
    });

    if errors.len() > 0 {
        return Err(errors.join("; ".into()));
    }
    Ok(())
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
            vid_to_img,
            vid_to_clip,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
