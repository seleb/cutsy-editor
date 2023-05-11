export function clamp(min: number, val: number, max: number) {
	return Math.max(min, Math.min(max, val));
}
