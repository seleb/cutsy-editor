import { Outlet } from 'react-router';
import { NavLink } from 'react-router-dom';

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
