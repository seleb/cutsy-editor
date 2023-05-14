import { appWindow } from '@tauri-apps/api/window';
import { useEffect } from 'react';

export function Title({ children }: { children?: string | (string | null | undefined)[] | null }) {
	useEffect(() => {
		appWindow.setTitle(['cutsy' as typeof children].concat((typeof children === 'string' ? [children] : children || []).map(i => i?.trim()).filter(i => i)).join(' | '));
		return () => {
			appWindow.setTitle('cutsy');
		};
	}, [children]);
	return null;
}
