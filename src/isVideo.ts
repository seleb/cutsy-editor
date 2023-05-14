const obj = document.createElement('video');
export function isVideo(path: string) {
	return (
		obj.canPlayType(`video/${path.split('.').pop()?.toLowerCase()}`) !== ''
	);
}
