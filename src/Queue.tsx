import { open } from '@tauri-apps/api/shell';
import { useEffect, useState } from 'react';
import { useQueue, useQueueShift } from './ContextApp';
import { useSettings } from './ContextSettings';
import { saveClip, saveImage } from './ffmpeg';

export function Queue() {
	const [first] = useQueue();
	const shift = useQueueShift();
	const { openAfterSave } = useSettings();
	// currently saving
	const [current, setCurrent] = useState(first);
	// last saved
	const [last, setLast] = useState<typeof current | null>(null);

	// save first item in queue then remove it
	useEffect(() => {
		if (first === current) return;
		setCurrent(first);
		if (!first) return;
		(async () => {
			console.log('saving', first);
			switch (first.command) {
				case 'vid_to_img':
					await saveImage(first);
					break;
				case 'vid_to_clip':
					await saveClip(first);
					break;
				default:
					throw new Error('Unsupported command');
			}
			setLast(first);
			shift();
		})();
	}, [first, current, shift]);

	// open last saved item then remove it
	useEffect(() => {
		if (last?.output && openAfterSave === 'true') {
			open(`file:///${last.output}`);
		}
		setLast(null);
	}, [last?.output, openAfterSave]);

	return null;
}
