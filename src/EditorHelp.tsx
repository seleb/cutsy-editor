import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { Button } from './Button';
import styles from './EditorHelp.module.scss';
import { H } from './H';
import { Icon } from './Icon';

const shortcuts = [
	['Space', 'play/pause'],
	['Shift+Space', 'preview clip'],
	['Ctrl+=', 'zoom in'],
	['Ctrl+-', 'zoom out'],
	['Ctrl+0', 'reset zoom'],
	['0', 'center track'],
	['M', 'mute/unmute'],
	['ArrowRight', 'forward'],
	['ArrowLeft', 'vackward'],
	['.', 'forward (frame)'],
	[',', 'backward (frame)'],
	['Alt+ArrowRight', 'forward (fast)'],
	['Alt+ArrowLeft', 'backward (fast)'],
	['Shift+ArrowRight', 'forward (faster)'],
	['Shift+ArrowLeft', 'backward (faster)'],
	['Ctrl+ArrowRight', 'end'],
	['Ctrl+ArrowLeft', 'start'],
	['Ctrl+S', 'save clip'],
].map(([shortcut, label]) => [
	shortcut,
	shortcut.split(/(?<!\+)\+/),
	label,
]) as [string, string[], string][];

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
	const toggleActive = useCallback(() => setActive((s) => !s), []);
	const refContainer = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const elContainer = refContainer.current;
		if (!elContainer) return;
		elContainer.scrollTo({ left: 0, top: 0 });
	}, [active]);
	return (
		<aside
			ref={refContainer}
			className={`${styles.container} ${active && styles.open}`}
		>
			<div>
				<Button
					title={`${active ? 'Close' : 'Open'} shortcuts`}
					onClick={toggleActive}
				>
					<Icon icon={active ? 'x' : '?'} />
				</Button>
				<H>shortcuts</H>
			</div>
			<dl>
				{shortcuts.map(([shortcut, keys, label]) => (
					<Shortcut key={shortcut} keys={keys} label={label} />
				))}
			</dl>
			<hr />
			<H>tips</H>
			<ul>
				<li>right-click on clip markers to snap them to the current time</li>
				<li>shift+click on timeline to snap start to cursor</li>
				<li>shift+right-click to snap end to cursor</li>
				<li>
					ffmpeg supports lots of file types: use <q>all files</q> when saving
					to try less common formats
				</li>
			</ul>
		</aside>
	);
}
