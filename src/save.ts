import { save } from '@tauri-apps/api/dialog';

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
		name: 'MP3 Audio',
		extensions: ['mp3'],
	},
	{
		name: 'PNG Sequence (include "%d" in file name)',
		extensions: ['png'],
	},
	{
		name: 'All files',
		extensions: ['*'],
	},
];

export function saveAsImageLocation(defaultPath: string | undefined) {
	return save({
		defaultPath,
		filters: filtersImages,
	});
}

export function saveAsVideoLocation(defaultPath: string | undefined) {
	return save({
		defaultPath,
		filters: filtersVideos,
	});
}
