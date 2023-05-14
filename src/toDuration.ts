export function toDuration(time: number) {
	const s = time % 60;
	time = Math.floor((time - s) / 60);
	const m = time % 60;
	time = Math.floor((time - m) / 60);
	const h = time;
	const a = [
		m.toFixed(0).padStart(2, '0'),
		[
			s.toFixed(0).padStart(2, '0'),
			(s % 1).toFixed(3).substring(2).padEnd(3, '0'),
		].join('.'),
	];
	if (h > 0) a.unshift(h.toFixed(0));
	return a.join(':');
}
