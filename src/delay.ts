export function delay(ms: number) {
	if (ms <= 0) return Promise.resolve();
	return new Promise((r) => {
		setTimeout(r, ms);
	});
}
