import { appWindow } from '@tauri-apps/api/window';
import { useEffect } from 'react';
import { isDesktop } from './isDesktop';

export function useFullscreenToggle() {
	useEffect(() => {
		if (!isDesktop) return undefined;
		const onKey = async (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				appWindow.setFullscreen(false);
				return;
			}
			const toggle =
				event.key === 'F11' ||
				(event.key === 'Enter' && (event.altKey || event.metaKey));
			if (!toggle) return;
			if (!(await appWindow.isFullscreen())) {
				await appWindow.setFullscreen(true);
			} else {
				await appWindow.setFullscreen(false);
			}
		};
		window.addEventListener('keyup', onKey);
		return () => {
			window.removeEventListener('keyup', onKey);
		};
	}, []);
}
