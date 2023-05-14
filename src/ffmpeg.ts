import { message, save } from '@tauri-apps/api/dialog';
import { open } from '@tauri-apps/api/shell';
import { invoke } from '@tauri-apps/api/tauri';

const filtersImages = [
	{
		name: 'PNG Image',
		extensions: ['png'],
	},
	{
		name: 'WebP Image',
		extensions: ['webp'],
	},
	{
		name: 'JPEG Image',
		extensions: ['jpg', 'jpeg'],
	},
	{
		name: 'GIF Image',
		extensions: ['gif'],
	},
	{
		name: 'All files',
		extensions: ['*'],
	},
];

const filtersVideos = [
	{
		name: 'MP4 Video',
		extensions: ['mp4'],
	},
	{
		name: 'WebM Video',
		extensions: ['webm'],
	},
	{
		name: 'Animated GIF',
		extensions: ['gif'],
	},
	{
		name: 'All files',
		extensions: ['*'],
	},
];

export async function isFfmpegInstalled() {
	return await invoke('is_ffmpeg_installed');
}

export async function installFfmpeg() {
	return await invoke('install_ffmpeg');
}

async function saveAt(options: Parameters<typeof save>[0], doSave: (output: string) => Promise<unknown>) {
	let output: string | null;
	try {
		output = await save(options);
		if (!output) return null; // cancelled
		await doSave(output);
		return output;
	} catch (err) {
		console.error(err);
		await message(`Failed to save file.\nThere may be more details in the console.\n\n${err}`, { title: 'Save error', type: 'error' });
	}
	return null;
}

async function saveAndOpen(...args: Parameters<typeof saveAt>) {
	const output = await saveAt(...args);
	if (!output) return;
	try {
		await open(`file:///${output}`);
	} catch (err) {
		console.error(err);
		await message(`The file was saved, but clilp failed to open it.\nThere may be more details in the console.\n\n${err}`, { title: 'Open error', type: 'warning' });
	}
}

export function saveImage({ defaultPath, input, time, open }: { defaultPath?: string; input: string; time: number; open?: boolean }) {
	return (open ? saveAndOpen : saveAt)(
		{
			defaultPath,
			filters: filtersImages,
		},
		output =>
			invoke<string>('vid_to_img', {
				input,
				output,
				time: `${time}us`,
			})
	);
}

export function saveClip({ defaultPath, input, start, duration, audio, open }: { defaultPath?: string; input: string; start: number; duration: number; audio: boolean; open?: boolean }) {
	return (open ? saveAndOpen : saveAt)(
		{
			defaultPath,
			filters: filtersVideos,
		},
		output =>
			invoke<string>('vid_to_clip', {
				input,
				output,
				start: `${start}us`,
				duration: `${duration}us`,
				audio,
			})
	);
}
