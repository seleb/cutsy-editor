import { invoke } from '@tauri-apps/api/tauri';

export const FRAMES_PER_SECOND = 60;
export const FRAME = 1 / FRAMES_PER_SECOND;

export function toMicroseconds(seconds: number) {
	// ffmpeg always seems to be ~2 frames off
	return Math.floor((seconds - FRAME * 2) * 1000000);
}

export async function isFfmpegInstalled() {
	return await invoke('is_ffmpeg_installed');
}

export async function installFfmpeg() {
	return await invoke('install_ffmpeg');
}

export function saveImage({ input, output, time }: { input: string; output: string; time: number }) {
	return invoke<string>('vid_to_img', {
		input,
		output,
		time: `${toMicroseconds(time)}us`,
	});
}

export function saveClip({ input, output, start, duration, audio }: { input: string; output: string; start: number; duration: number; audio: boolean }) {
	return invoke<string>('vid_to_clip', {
		input,
		output,
		start: `${toMicroseconds(start)}us`,
		duration: `${toMicroseconds(duration)}us`,
		audio,
	});
}
