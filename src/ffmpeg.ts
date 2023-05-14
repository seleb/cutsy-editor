import { invoke } from "@tauri-apps/api/tauri";

export async function isFfmpegInstalled() {
	return await invoke('is_ffmpeg_installed');
}

export async function installFfmpeg() {
	return await invoke('install_ffmpeg');
}
