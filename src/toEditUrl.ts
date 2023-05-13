export function toEditUrl(path: string) {
	return `/edit?v=${encodeURIComponent(path)}`;
}
