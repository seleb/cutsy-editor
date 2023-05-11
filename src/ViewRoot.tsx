import { Outlet } from 'react-router';
import { NavLink } from 'react-router-dom';

import { Clilp } from './Clilp';
import { Debug } from './Debug';
import { H, HLevel } from './H';
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
					<NavLink to="/">Home</NavLink>
					<NavLink to="videos">Video</NavLink>
					<NavLink to="settings">Settings</NavLink>
					<Debug>
						<NavLink to="debug">Debug</NavLink>
					</Debug>
				</nav>
			</header>
			<main className={styles.main}>
				<HLevel>
					<Outlet />
				</HLevel>
			</main>
		</>
	);
}
