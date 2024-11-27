import { confirm } from '@tauri-apps/api/dialog';
import { appWindow } from '@tauri-apps/api/window';

/** prompts user before quitting
 * @returns callback to cancel prompt
 */
export async function safeQuit(message: string) {
	const unlisten = await appWindow.onCloseRequested(async (event) => {
		const confirmed = await confirm(message);
		if (!confirmed) {
			// user did not confirm closing the window; let's prevent it
			event.preventDefault();
		}
	});
	return unlisten;
}
