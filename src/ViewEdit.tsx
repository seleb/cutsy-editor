import { message, save } from '@tauri-apps/api/dialog';
import { open } from '@tauri-apps/api/shell';
import { convertFileSrc, invoke } from '@tauri-apps/api/tauri';
import { PointerEventHandler, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Icon } from './Icon';
import { KeyboardShortcuts } from './KeyboardShortcuts';
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
	const a= [
		m.toFixed(0).padStart(2, '0'),
		[s.toFixed(0).padStart(2, '0'), (s % 1).toFixed(3).substring(2).padEnd(3, '0')].join('.')
	];
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

	//
	useEffect(() => {
		let mounted = true;
		const elVideo = refVideo.current;
		const elProgress = refProgress.current;
		const elTime = refTime.current;
		if (!elVideo || !elProgress || !elTime) return;
		const onUpdate: VideoFrameRequestCallback = (_now, metadata) => {
			elProgress.value = metadata.mediaTime;
			elTime.textContent = toDuration(metadata.mediaTime);
			if (mounted) {
				elVideo.requestVideoFrameCallback(onUpdate);
			}
		};
		elVideo.requestVideoFrameCallback(onUpdate);

		return () => {
			mounted = false;
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
		if (!elVideo || !elProgress || !elVideo?.duration) {
			return;
		}
		if (loop && to < 0 && elVideo.currentTime < FRAME * 2) {
			elProgress.value = elVideo.currentTime = elVideo.duration - FRAME;
		} else if (loop && to > elVideo.duration && elVideo.currentTime - elVideo.duration > -FRAME * 2) {
			elProgress.value = elVideo.currentTime = 0;
		} else {
			elProgress.value = elVideo.currentTime = clamp(0, to, elVideo.duration - FRAME);
		}
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

	const onScrubStart = useCallback<PointerEventHandler<HTMLProgressElement>>(
		event => {
			const elVideo = refVideo.current;
			const elProgress = event.currentTarget as HTMLProgressElement;
			if (!elVideo || !elVideo?.duration) return;

			const onScrub = (eventScrub: PointerEvent) => {
				eventScrub.preventDefault();
				const rect = elProgress.getBoundingClientRect();
				const pos = (eventScrub.pageX - rect.left) / elProgress.offsetWidth;
				seek(pos * elVideo.duration, false);
			};

			const onScrubStop = (eventScrub: PointerEvent) => {
				eventScrub.preventDefault();
				window.removeEventListener('pointermove', onScrub);
				window.removeEventListener('pointerup', onScrubStop);
			};

			window.addEventListener('pointermove', onScrub);
			window.addEventListener('pointerup', onScrubStop);

			onScrub(event.nativeEvent);
		},
		[seek]
	);

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
				output =>
					invoke<string>('vid_to_clip', {
						input: pathDecoded,
						output,
						start: `${toMicroseconds(refVideo.current?.currentTime || 0)}us`,
						duration: `${toMicroseconds((refVideo.current?.duration || 0) / 10)}us`,
					})
			),
		[pathDecoded, name]
	);

	if (!pathEncoded) throw new Error('No video path!');
	return (
		<div className={styles.container}>
			<Title>{['videos', name]}</Title>
			<video ref={refVideo} onClick={togglePlaying} className={styles.video} controls={false} src={src} preload="auto" muted={muted} loop></video>
			<div className={styles.controls}>
				<div className={styles.trackbar}>
					<progress className={styles.progress} ref={refProgress} onPointerDown={onScrubStart} value={0} max={duration}></progress>
					<div className={styles.playhead} />
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
			<KeyboardShortcuts />
		</div>
	);
}
