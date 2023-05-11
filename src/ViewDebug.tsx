import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Debug } from './Debug';
import { H, HLevel } from './H';
import { Page } from './Page';
import styles from './ViewDebug.module.scss';

function DebugPalette() {
	return (
		<>
			<H>Palette</H>
			<ul className={styles.palette}>
				{['primary', 'primary-muted', 'primary-bright', 'neutral-0', 'neutral-2', 'neutral-4', 'neutral-6', 'neutral-8', 'neutral-9', 'black', 'white'].map(i => (
					<li
						key={i}
						style={{
							backgroundColor: `var(--color-${i})`,
							color: {
								primary: 'var(--color-neutral-9)',
								'primary-muted': 'var(--color-neutral-9)',
								'primary-bright': 'var(--color-neutral-0)',
								'neutral-6': 'var(--color-neutral-0)',
								'neutral-8': 'var(--color-neutral-0)',
								'neutral-9': 'var(--color-neutral-0)',
								white: 'var(--color-black)',
								black: 'var(--color-white)',
							}[i],
						}}
					>
						{i}
					</li>
				))}
			</ul>
		</>
	);
}

export function ViewDebug() {
	const [error, setError] = useState(false);
	const doError = useCallback(() => {
		setError(true);
	}, []);
	useEffect(() => {
		if (!error) return;
		throw new Error('mock error');
	});
	return (
		<Debug>
			<Page>
				<H>Debug</H>
				<HLevel>
					<div>
						<Link to="error">Go to broken view</Link>
					</div>
					<button onClick={doError}>Break this view</button>
					<DebugPalette />
				</HLevel>
			</Page>
		</Debug>
	);
}