import { message, save } from '@tauri-apps/api/dialog';
import { open } from '@tauri-apps/api/shell';
import { convertFileSrc, invoke } from '@tauri-apps/api/tauri';
import { MouseEventHandler, PointerEventHandler, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { EditorHelp } from './EditorHelp';
import { Icon } from './Icon';
import { Loading } from './Loading';
import { Title } from './Title';
import styles from './ViewEdit.module.scss';
import { clamp } from './clamp';

const FRAMES_PER_SECOND = 60;
const FRAME = 1 / FRAMES_PER_SECOND;

const filtersImages = [
	{
		name: 'PNG Image',
		extensions: ['png'],
	},
	{
		name: 'WebP Image',
		extensions: ['webp'],
	},
	{
		name: 'JPEG Image',
		extensions: ['jpg', 'jpeg'],
	},
	{
		name: 'All files',
		extensions: ['*'],
	},
];

const filtersVideos = [
	{
		name: 'MP4 Video',
		extensions: ['mp4'],
	},
	{
		name: 'WebM Video',
		extensions: ['webm'],
	},
	{
		name: 'All files',
		extensions: ['*'],
	},
];

function toMicroseconds(seconds: number) {
	// ffmpeg always seems to be ~2 frames off
	return Math.floor((seconds - FRAME * 2) * 1000000);
}

function toDuration(time: number) {
	const s = time % 60;
	time = Math.floor((time - s) / 60);
	const m = time % 60;
	time = Math.floor((time - m) / 60);
	const h = time;
	const a = [m.toFixed(0).padStart(2, '0'), [s.toFixed(0).padStart(2, '0'), (s % 1).toFixed(3).substring(2).padEnd(3, '0')].join('.')];
	if (h > 0) a.unshift(h.toFixed(0));
	return a.join(':');
}

export function ViewEdit() {
	const [search] = useSearchParams();
	const pathEncoded = search.get('v') || '';
	const pathDecoded = useMemo(() => decodeURIComponent(pathEncoded), [pathEncoded]);
	const src = useMemo(() => convertFileSrc(pathDecoded), [pathDecoded]);
	const name = useMemo(() => {
		const basename = pathDecoded.split(/[\\\/]/).pop();
		const parts = basename?.split('.');
		parts?.pop();
		return parts?.join('.');
	}, [pathDecoded]);

	const refVideo = useRef<HTMLVideoElement>(null);
	const refProgress = useRef<HTMLProgressElement>(null);
	const refTime = useRef<HTMLElement>(null);
	const refClip = useRef<HTMLDivElement>(null);

	const [paused, setPaused] = useState(true);
	const [muted, setMuted] = useState(false);
	const [duration, setDuration] = useState(0);

	const togglePlaying = useCallback(() => {
		setPaused(s => !s);
	}, []);
	const toggleMuted = useCallback(() => {
		setMuted(s => !s);
	}, []);

	// get video duration for scrubber
	useEffect(() => {
		const elVideo = refVideo.current;
		if (!elVideo) return;
		const onLoaded = () => {
			setDuration(elVideo.duration);
		};
		elVideo.addEventListener('loadedmetadata', onLoaded);
		return () => {
			elVideo.removeEventListener('loadedmetadata', onLoaded);
		};
	}, []);

	// update to match video time
	useEffect(() => {
		let vfc: number;
		const elVideo = refVideo.current;
		const elProgress = refProgress.current;
		const elTime = refTime.current;
		if (!elVideo || !elProgress || !elTime) return;
		const onUpdate: VideoFrameRequestCallback = (_now, metadata) => {
			elProgress.value = metadata.mediaTime;
			elTime.textContent = toDuration(metadata.mediaTime);
			vfc = elVideo.requestVideoFrameCallback(onUpdate);
		};
		vfc = elVideo.requestVideoFrameCallback(onUpdate);

		return () => {
			elVideo.cancelVideoFrameCallback(vfc);
		};
	}, []);

	// play/pause
	useEffect(() => {
		const elVideo = refVideo.current;
		if (!elVideo) return;
		if (paused) {
			elVideo.pause();
		} else {
			elVideo.play();
		}
	}, [paused]);

	const getSkip = useCallback(
		({ metaKey, ctrlKey, altKey, shiftKey }: KeyboardEvent) => {
			if (ctrlKey || metaKey) {
				return Infinity;
			}
			if (shiftKey) {
				return duration * 0.3;
			}
			if (altKey) {
				return duration * 0.1;
			}
			return duration * 0.05;
		},
		[duration]
	);

	const seek = useCallback((to: number, loop = true) => {
		const elVideo = refVideo.current;
		const elProgress = refProgress.current;
		const elTime = refTime.current;
		if (!elVideo || !elProgress || !elTime || !elVideo?.duration) {
			return;
		}
		let t: number;
		if (loop && to < 0 && elVideo.currentTime < FRAME * 2) {
			t = elVideo.duration - FRAME;
		} else if (loop && to > elVideo.duration && elVideo.currentTime - elVideo.duration > -FRAME * 2) {
			t = 0;
		} else {
			t = clamp(0, to, elVideo.duration - FRAME);
		}
		elProgress.value = elVideo.currentTime = t;
		elTime.textContent = toDuration(t);
		return t;
	}, []);

	const seekBy = useCallback((by: number) => {
		const elVideo = refVideo.current;
		if (!elVideo) return;
		seek(elVideo.currentTime + by);
	}, []);

	useEffect(() => {
		const onKey = (event: KeyboardEvent) => {
			const { key } = event;
			switch (key) {
				case 'ArrowRight':
					seekBy(getSkip(event));
					event.preventDefault();
					break;
				case 'ArrowLeft':
					seekBy(-getSkip(event));
					event.preventDefault();
					break;
				case '.':
					seekBy(FRAME);
					event.preventDefault();
					break;
				case ',':
					seekBy(-FRAME);
					event.preventDefault();
					break;
				case ' ':
					togglePlaying();
					event.preventDefault();
					break;
				case 'm':
					toggleMuted();
					event.preventDefault();
					break;
				default:
					break;
			}
		};
		window.addEventListener('keydown', onKey);
		return () => {
			window.removeEventListener('keydown', onKey);
		};
	}, [getSkip, seekBy, togglePlaying, toggleMuted]);

	const onScrubStart = useCallback<
		(options: {
			/** called on start.
			 * if returns `false`, scrub is aborted.
			 * if returns `true`, scrub is also called on start.
			 * if no return, scrub is called on first move.
			 * can pass `true` instead of a callback to always run `scrub` parameter on start */
			start?: ((event: PointerEvent) => boolean | void) | true;
			/** called on each movement during scrubbing */
			scrub?: (event: PointerEvent) => void;
			/** called when scrubbing is released */
			end?: (event: PointerEvent) => void;
		}) => PointerEventHandler<Element>
	>(
		({ start, scrub, end }) =>
			event => {
				if (typeof start === 'function') {
					const startVal = start(event.nativeEvent) !== false;
					if (startVal === true) {
						scrub?.(event.nativeEvent);
					} else if (startVal === false) {
						return;
					}
				} else if (start) {
					scrub?.(event.nativeEvent);
				}

				const onScrubStop = (eventScrub: PointerEvent) => {
					eventScrub.preventDefault();
					if (scrub) window.removeEventListener('pointermove', scrub);
					if (end) window.removeEventListener('pointerup', end);
					window.removeEventListener('pointerup', onScrubStop);
				};

				if (scrub) window.addEventListener('pointermove', scrub);
				if (end) window.addEventListener('pointerup', end);
				window.addEventListener('pointerup', onScrubStop);
			},
		[seek]
	);

	const onScrubStartPlayhead = useCallback(
		onScrubStart({
			start: true,
			scrub: (event: PointerEvent) => {
				const elVideo = refVideo.current;
				const elProgress = refProgress.current as HTMLProgressElement;
				if (!elVideo || !elVideo?.duration) return;
				event.preventDefault();
				const rect = elProgress.getBoundingClientRect();
				const pos = (event.pageX - rect.left) / elProgress.offsetWidth;
				seek(pos * elVideo.duration, false);
			},
		}),
		[]
	);

	const onUpdateClip = useCallback((start?: number, end?: number, slide?: number) => {
		const elClip = refClip.current;
		if (!elClip) return;
		const oldStart = Number((elClip.style.left || '0%').replace('%', '')) / 100;
		const oldEnd = Number((elClip.style.width || '100%').replace('%', '')) / 100 + oldStart;
		let newStart = start ?? oldStart;
		let newEnd = end ?? oldEnd;
		if (newEnd < newStart) [newStart, newEnd] = [newEnd, newStart];
		if (slide !== undefined) {
			newStart += slide;
			newEnd += slide;
		}
		elClip.style.left = `${clamp(0, newStart, 1) * 100}%`;
		elClip.style.width = `${clamp(0, newEnd - newStart, 1 - newStart) * 100}%`;
	}, []);

	const onScrubStartMarker = useMemo(() => {
		let target: Element;
		let isStart = true;
		let start = 0;
		let end = 0;
		return onScrubStart({
			start: (event: PointerEvent) => {
				const elVideo = refVideo.current;
				const elClip = refClip.current;
				const elProgress = refProgress.current as HTMLProgressElement;
				if (!elVideo || !elVideo?.duration || !elClip || !elProgress) return;

				start = Number((elClip.style.left || '0%').replace('%', '')) / 100;
				end = Number((elClip.style.width || '100%').replace('%', '')) / 100 + start;

				target = event.target as Element;
				isStart = elClip.firstChild === target || elClip.firstChild?.contains(target) || false;
				if (event.button && event.button !== 1) {
					event.preventDefault();
					const pos = elVideo.currentTime/elVideo.duration;
					isStart ? onUpdateClip(pos, undefined) : onUpdateClip(undefined, pos);
					return false;
				}
				return true;
			},
			scrub: (event: PointerEvent) => {
				const elVideo = refVideo.current;
				const elClip = refClip.current;
				const elProgress = refProgress.current as HTMLProgressElement;
				if (!elVideo || !elVideo?.duration || !elClip || !elProgress) return;
				event.preventDefault();
				const rect = elProgress.getBoundingClientRect();
				const pos = clamp(0, (event.pageX - rect.left) / elProgress.offsetWidth, 1);
				seek(pos * elVideo.duration, false);
				isStart ? onUpdateClip(pos, end) : onUpdateClip(start, pos);
			},
		})
	},
		[onUpdateClip]
	);

	const onScrubStartClip = useMemo(() => {
		return onScrubStart({
			start: (event: PointerEvent) => {
				if (event.target !== refClip.current) return false;
			},
			scrub: (event: PointerEvent) => {
				const elProgress = refProgress.current as HTMLProgressElement;
				const elClip = refProgress.current as HTMLProgressElement;
				if (!elProgress || !elClip) return;
				event.preventDefault();
				const rect = elClip.getBoundingClientRect();
				if ((event.movementX < 0 && event.pageX > rect.right) || (event.movementX > 0 && event.pageX < rect.left)) return;
				onUpdateClip(undefined, undefined, event.movementX / elProgress.offsetWidth);
			},
		});
	}, [onUpdateClip]);

	const [saving, setSavingClip] = useState(false);
	const saveAndOpen = useCallback(async (options: Parameters<typeof save>[0], doSave: (output: string) => Promise<unknown>) => {
		setSavingClip(true);
		let output: string | null;
		try {
			output = await save(options);
			if (!output) return; // cancelled
			await doSave(output);
		} catch (err) {
			console.error(err);
			await message(`Failed to save file.\nThere may be more details in the console.\n\n${err}`, { title: 'Save error', type: 'error' });
			return;
		} finally {
			setSavingClip(false);
		}
		try {
			await open(`file:///${output}`);
		} catch (err) {
			console.error(err);
			await message(`The file was saved, but clilp failed to open it.\nThere may be more details in the console.\n\n${err}`, { title: 'Open error', type: 'warning' });
		}
	}, []);

	const onSaveImage = useCallback(
		() =>
			saveAndOpen(
				{
					defaultPath: name,
					filters: filtersImages,
				},
				output =>
					invoke<string>('vid_to_img', {
						input: pathDecoded,
						output,
						time: `${toMicroseconds(refVideo.current?.currentTime || 0)}us`,
					})
			),
		[pathDecoded, name]
	);

	const onSaveClip = useCallback(
		() =>
			saveAndOpen(
				{
					defaultPath: name,
					filters: filtersVideos,
				},
				output =>{
					const elVideo = refVideo.current;
					const elClip = refClip.current;
					if (!elVideo || !elClip) throw new Error("Could not find elements");
					const start = Number((elClip.style.left || '0%').replace('%', '')) / 100;
					const width = Number((elClip.style.width || '100%').replace('%', '')) / 100;
					return invoke<string>('vid_to_clip', {
						input: pathDecoded,
						output,
						start: `${toMicroseconds(start * elVideo.duration || 0)}us`,
						duration: `${toMicroseconds(width * elVideo.duration || 0)}us`,
					})}
			),
		[pathDecoded, name]
	);

	const noContextMenu = useCallback<MouseEventHandler<SVGSVGElement | HTMLElement>>((event) => {
		event.preventDefault();
	}, []);

	if (!pathEncoded) throw new Error('No video path!');
	return (
		<div className={styles.container}>
			<Title>{['videos', name]}</Title>
			<video ref={refVideo} onClick={togglePlaying} className={styles.video} controls={false} src={src} preload="auto" muted={muted} loop></video>
			<div className={styles.controls}>
				<div className={styles.trackbar} onContextMenu={noContextMenu}>
					<progress className={styles.progress} ref={refProgress} onPointerDown={onScrubStartPlayhead} value={0} max={duration} onContextMenu={noContextMenu}></progress>
					<div ref={refClip} className={styles.clip} onPointerDown={onScrubStartClip} onContextMenu={noContextMenu}>
						<Icon title="Drag start of clip" icon="pin" className={styles.start} onPointerDown={onScrubStartMarker} onContextMenu={noContextMenu} />
						<Icon title="Drag end of clip" icon="pin" className={styles.end} onPointerDown={onScrubStartMarker} onContextMenu={noContextMenu} />
					</div>
				</div>
				<div className={styles.buttons}>
					<button onClick={togglePlaying} title={paused ? 'Play' : 'Pause'}>
						<Icon icon={paused ? 'play' : 'pause'} />
					</button>
					<button onClick={toggleMuted} title={muted ? 'Unmute' : 'Mute'}>
						<Icon icon={muted ? 'muted' : 'sound'} />
					</button>
					<span className={styles.time}>
						<span ref={refTime}>{0}</span> / <span>{toDuration(duration)}</span>
					</span>
					<div className={styles.save}>
						<button disabled={saving} onClick={onSaveImage} title="Save image">
							<Icon icon="exportImage" />
						</button>
						<button disabled={saving} onClick={onSaveClip} title="Save clip">
							<Icon icon="exportClip" />
						</button>
					</div>
				</div>
				<Loading className={styles.saving} loading={saving} msgLoading="saving..." />
			</div>
			<EditorHelp />
		</div>
	);
}
