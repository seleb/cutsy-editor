// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command

use ffmpeg_sidecar::{command::FfmpegCommand, paths::ffmpeg_path};
use std::{
    path::Path,
    process::{Command, Stdio},
};
use tauri::Manager;

// create the error type that represents all errors possible in our program
#[derive(Debug, thiserror::Error)]
enum Error {
    #[error(transparent)]
    Io(#[from] std::io::Error),

    #[error(transparent)]
    Ffmpeg(#[from] ffmpeg_sidecar::error::Error),

    #[error("{0}")]
    Other(String),
}

// we must manually implement serde::Serialize
impl serde::Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}

#[tauri::command]
async fn is_ffmpeg_installed() -> Result<bool, Error> {
    match Command::new(ffmpeg_path())
        .arg("-version")
        .stderr(Stdio::null())
        .stdout(Stdio::null())
        .spawn()
    {
        Ok(_) => Ok(true),
        Err(_) => Ok(false),
    }
}

#[tauri::command]
async fn install_ffmpeg() -> Result<(), Error> {
    match ffmpeg_sidecar::download::auto_download() {
        Ok(_) => Ok(()),
        Err(e) => Err(Error::from(e)),
    }
}

#[tauri::command]
async fn vid_to_img(input: String, output: String, time: String) -> Result<(), Error> {
    let path_input = Path::new(&input);
    let path_output = Path::new(&output);
    if !path_input.exists() {
        return Err(Error::Other("Source video does not exist".into()));
    }

    let mut errors: Vec<String> = vec![];
    FfmpegCommand::new()
        .create_no_window()
        // allow overwriting
        .overwrite()
        // automatically use hardware acceleration
        .hwaccel("auto")
        // no audio
        .no_audio()
        // no vysnc
        .arg("-vsync")
        .arg(0.to_string())
        // seek
        .seek(time)
        // input
        .input(path_input.as_os_str().to_str().unwrap())
        // one image
        .arg("-update")
        .arg(1.to_string())
        .frames(1)
        // lossless
        .arg("-lossless")
        .arg(1.to_string())
        .arg("-compression_level")
        .arg(6.to_string())
        .arg("-quality")
        .arg(100.to_string())
        .arg("-qscale")
        .arg(100.to_string())
        .arg("-qmin")
        .arg(1.to_string())
        .arg("-q:v")
        .arg(1.to_string())
        // output
        .output(path_output.as_os_str().to_str().unwrap())
        // spawn + catch errors
        .spawn()?
        .iter()?
        .filter_errors()
        .for_each(|e| errors.push(e));

    if errors.len() > 0 {
        return Err(Error::Other(errors.join("; ".into())));
    }
    Ok(())
}

#[tauri::command]
async fn vid_to_clip(
    input: String,
    output: String,
    start: String,
    duration: String,
    audio: bool,
) -> Result<(), Error> {
    let path_input = Path::new(&input);
    let path_output = Path::new(&output);
    if !path_input.exists() {
        return Err(Error::Other("Source video does not exist".into()));
    }

    let mut errors: Vec<String> = vec![];
    let mut command = FfmpegCommand::new();

    command
        .create_no_window()
        // allow overwriting
        .overwrite()
        // automatically use hardware acceleration
        .hwaccel("auto");

    // no audio
    if !audio {
        command.no_audio();
    }

    command
        // no vysnc
        .arg("-vsync")
        .arg(0.to_string())
        // seek
        .seek(start)
        // duration
        .duration(duration)
        // input
        .input(path_input.as_os_str().to_str().unwrap())
        // output
        .output(path_output.as_os_str().to_str().unwrap())
        .spawn()?
        .iter()?
        .filter_errors()
        .for_each(|e| errors.push(e));

    if errors.len() > 0 {
        return Err(Error::Other(errors.join("; ".into())));
    }
    Ok(())
}

// adapted from https://github.com/tauri-apps/tauri/issues/996#issuecomment-1263279485
#[tauri::command]
fn filemodified(filename: &str) -> Result<u64, String> {
    use std::fs;
    use std::time::UNIX_EPOCH;

    let metadata = fs::metadata(filename).expect("Failed to stat file");
    let time = metadata.modified().expect("Failed to get mtime");
    let millis = time
        .duration_since(UNIX_EPOCH)
        .expect("Failed to calculate mtime")
        .as_millis();

    let u64millis = u64::try_from(millis).expect("Number too large");
    return Ok(u64millis);
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
            filemodified,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
