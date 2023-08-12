export function toEditUrl(path: string) {
	return path ? `/edit?v=${encodeURIComponent(path)}` : '';
}
