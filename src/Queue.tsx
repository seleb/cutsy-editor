import { message } from '@tauri-apps/api/dialog';
import { open } from '@tauri-apps/api/shell';
import { useEffect, useState } from 'react';
import { useQueue, useQueueShift } from './ContextApp';
import { useSettings } from './ContextSettings';
import { saveClip, saveImage } from './ffmpeg';
import { getErrorMessage } from './getErrorMessage';

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
			try {
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
			} catch (err) {
				setLast(null);
				await message(
					`Failed to save file.\nThere may be more details in the console.\n\n${getErrorMessage(
						err
					)}`,
					{ title: 'Save error', type: 'error' }
				);
			} finally {
				shift();
			}
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
