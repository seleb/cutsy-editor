import { Outlet, useNavigate } from 'react-router';
import { NavLink } from 'react-router-dom';

import { listen } from '@tauri-apps/api/event';
import { useEffect } from 'react';
import { Clilp } from './Clilp';
import { Debug } from './Debug';
import { GateFfmpeg } from './GateFfmpeg';
import { H, HLevel } from './H';
import { Icon } from './Icon';
import { Title } from './Title';
import styles from './ViewRoot.module.scss';
import { useFullscreenToggle } from './useFullscreenToggle';
export function ViewRoot() {
	useFullscreenToggle();

	const navigate = useNavigate();

	// edit video on drag+dropping a video
	useEffect(() => {
		listen('tauri://file-drop', event => {
			const file = (event.payload as string[])?.[0];
			if (!file) return;
			navigate(`/edit?v=${encodeURIComponent(file)}`);
		});
	}, [navigate]);
	return (
		<>
			<Title>clilp</Title>
			<header className={styles.header}>
				<H>
					<Clilp />
				</H>
				<nav>
					<NavLink to="videos" title="Videos">
						<Icon icon="videos" />
					</NavLink>
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
