import { invoke } from '@tauri-apps/api/tauri';

export const FRAMES_PER_SECOND = 60;
export const FRAME = 1 / FRAMES_PER_SECOND;

/** ffmpeg always seems to be ~2 frames off */
export const CORRECTION = -FRAME * 2;

export function toMicroseconds(seconds: number) {
	return Math.floor((seconds + CORRECTION) * 1000000);
}

export function isFfmpegInstalled() {
	return invoke('is_ffmpeg_installed');
}

export function installFfmpeg() {
	return invoke('install_ffmpeg');
}

export function saveImage({
	input,
	output,
	time,
}: {
	input: string;
	output: string;
	time: number;
}) {
	return invoke<string>('vid_to_img', {
		input,
		output,
		time: `${toMicroseconds(time)}us`,
	});
}

export function saveClip({
	input,
	output,
	start,
	duration,
	audio,
}: {
	input: string;
	output: string;
	start: number;
	duration: number;
	audio: boolean;
}) {
	return invoke<string>('vid_to_clip', {
		input,
		output,
		start: `${toMicroseconds(start)}us`,
		duration: `${toMicroseconds(duration)}us`,
		audio,
	});
}
