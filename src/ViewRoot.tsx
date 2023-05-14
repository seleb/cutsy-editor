import { Outlet, useNavigate } from 'react-router';
import { NavLink } from 'react-router-dom';

import { message, open } from '@tauri-apps/api/dialog';
import { listen } from '@tauri-apps/api/event';
import { useCallback, useEffect } from 'react';
import { useQueue, useVideo } from './ContextApp';
import { Debug } from './Debug';
import { GateFfmpeg } from './GateFfmpeg';
import { H, HLevel } from './H';
import { Icon } from './Icon';
import { Name } from './Name';
import { Title } from './Title';
import styles from './ViewRoot.module.scss';
import { isVideo } from './isVideo';
import { toEditUrl } from './toEditUrl';
import { useFullscreenToggle } from './useFullscreenToggle';

export function ViewRoot() {
	useFullscreenToggle();

	const navigate = useNavigate();

	// edit video on drag+dropping a video
	useEffect(() => {
		listen('tauri://file-drop', (event) => {
			const file = (event.payload as string[])?.[0];
			if (!file) return undefined;
			if (!isVideo(file))
				return message('File is not a supported video format :(', {
					type: 'error',
				});
			navigate(toEditUrl(file));
			return undefined;
		});
	}, [navigate]);

	const onOpen = useCallback(async () => {
		let file = await open({
			multiple: false,
			directory: false,
		});
		if (!file) return undefined;
		file = typeof file === 'string' ? file : file[0];
		if (!isVideo(file))
			return message('File is not a supported video format :(', {
				type: 'error',
			});
		navigate(toEditUrl(file));
		return undefined;
	}, [navigate]);

	const { path } = useVideo();
	const queue = useQueue();

	return (
		<>
			<Title>cutsy</Title>
			<header className={styles.header}>
				<H>
					<Name />
				</H>
				<nav>
					<button type="button" title="Open file" onClick={onOpen}>
						<Icon icon="open" />
					</button>
					<NavLink
						aria-disabled={!path}
						to={path ? `edit?v=${encodeURIComponent(path)}` : ''}
						title="Edit"
					>
						<Icon icon="edit" />
					</NavLink>
					<NavLink to="videos" title="Videos">
						<Icon icon="videos" />
					</NavLink>
					<NavLink to="queue" title="Queue" data-count={queue.length}>
						<Icon icon="exportImage" />
					</NavLink>
					<hr />
					<NavLink to="settings" title="Settings">
						<Icon icon="settings" />
					</NavLink>
					<Debug>
						<hr />
						<NavLink to="debug" title="Debug">
							<Icon icon="debug" />
						</NavLink>
					</Debug>
				</nav>
			</header>
			<main className={styles.main}>
				<HLevel>
					<GateFfmpeg>
						<Outlet />
					</GateFfmpeg>
				</HLevel>
			</main>
		</>
	);
}
