import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { Button } from './Button';
import styles from './EditorHelp.module.scss';
import { H } from './H';
import { Icon } from './Icon';

const shortcuts = [
	['Space', 'Play/Pause'],
	['Shift+Space', 'Preview clip'],
	['Ctrl++', 'Zoom in'],
	['Ctrl+-', 'Zoom out'],
	['Ctrl+0', 'Reset Zoom'],
	['0', 'Center track'],
	['M', 'Mute/Unmute'],
	['ArrowRight', 'Forward'],
	['ArrowLeft', 'Backward'],
	['.', 'Forward (frame)'],
	[',', 'Backward (frame)'],
	['Alt+ArrowRight', 'Forward (fast)'],
	['Alt+ArrowLeft', 'Backward (fast)'],
	['Shift+ArrowRight', 'Forward (faster)'],
	['Shift+ArrowLeft', 'Backward (faster)'],
	['Ctrl+ArrowRight', 'End'],
	['Ctrl+ArrowLeft', 'Start'],
	['Ctrl+S', 'Save clip'],
].map(([shortcut, label]) => [shortcut, shortcut.split(/(?<!\+)\+/), label]) as [string, string[], string][];

const replacements: { [key: string]: string } = {
	Space: '␣',
	ArrowRight: '→',
	ArrowLeft: '←',
	ArrowUp: '↑',
	ArrowDown: '↓',
};

function Shortcut({ keys, label }: { keys: string[]; label: string }) {
	return (
		<>
			<dt>
				{keys.length > 1 ? (
					<kbd className={styles.multi}>
						{keys.map((i, idx) => (
							<Fragment key={i}>
								<kbd aria-label={i}>{replacements[i] || i}</kbd>
								{idx === keys.length - 1 ? '' : '+'}
							</Fragment>
						))}
					</kbd>
				) : (
					<kbd aria-label={keys[0]}>{replacements[keys[0]] || keys[0]}</kbd>
				)}
			</dt>
			<dd>{label}</dd>
		</>
	);
}

export function EditorHelp() {
	const [active, setActive] = useState(false);
	const toggleActive = useCallback(() => setActive(s => !s), []);
	const refContainer = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const elContainer = refContainer.current;
		if (!elContainer) return;
		elContainer.scrollTo({ left: 0, top: 0 });
	}, [!active]);
	return (
		<aside ref={refContainer} className={`${styles.container} ${active && styles.open}`}>
			<div>
				<Button title={`${active ? 'Close' : 'Open'} shortcuts`} onClick={toggleActive}>
					<Icon icon={active ? 'x' : '?'} />
				</Button>
				<H>Shortcuts</H>
			</div>
			<dl>
				{shortcuts.map(([shortcut, keys, label]) => (
					<Shortcut key={shortcut} keys={keys} label={label} />
				))}
			</dl>
			<hr />
			<H>Tips</H>
			<p>right-click on clip markers to snap them to the current time</p>
			<p>shift+click on timeline to snap start to cursor, shift+right-click to snap end to cursor</p>
		</aside>
	);
}
