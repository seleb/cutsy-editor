import { message, save } from '@tauri-apps/api/dialog';
import { open } from '@tauri-apps/api/shell';
import { convertFileSrc, invoke } from '@tauri-apps/api/tauri';
import { PointerEventHandler, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Title } from './Title';
import styles from './ViewEdit.module.scss';
import { clamp } from './clamp';

const FRAMES_PER_SECOND = 60;
const FRAME = 1 / FRAMES_PER_SECOND;

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
		if (!elVideo || !elProgress) return;
		const onUpdate: VideoFrameRequestCallback = (_now, metadata) => {
			elProgress.value = metadata.mediaTime;
			elVideo.requestVideoFrameCallback(onUpdate);
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
		if (!elVideo || !elProgress) {
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
			if (!elVideo) return;

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

	const onSave = useCallback(async () => {
		let output: string | null;
		try {
			output = await save({
				defaultPath: name,
				filters: [
					{
						name: 'Image',
						extensions: ['png', 'webp', 'jpg'],
					},
				],
			});
			if (!output) return; // cancelled

			// ffmpeg always seems to be ~2 frames off
			await invoke<string>('vid_to_img', { input: pathDecoded, output, time: `${Math.floor(((refVideo.current?.currentTime || 0) - FRAME * 2) * 1000000)}us` });
		} catch (err) {
			console.error(err);
			await message(`Failed to save image.\nThere may be more details in the console.\n\n${err}`, { title: 'Save error', type: 'error' });
			return;
		}
		try {
			await open(`file:///${output}`);
		} catch (err) {
			console.error(err);
			await message(`The file was saved, but clilp failed to open it.\nThere may be more details in the console.\n\n${err}`, { title: 'Open error', type: 'warning' });
		}
	}, [pathDecoded, name]);

	if (!pathEncoded) throw new Error('No video path!');
	return (
		<div className={styles.container}>
			<Title>{['videos', name]}</Title>
			<video ref={refVideo} onClick={togglePlaying} className={styles.video} controls={false} src={src} preload="auto" muted={muted} loop></video>
			<div className={styles.controls}>
				<button onClick={togglePlaying} title={paused ? 'Play' : 'Pause'}>
					{paused ? '▶' : '⏸'}
				</button>
				<button onClick={toggleMuted} title={muted ? 'Unmute' : 'Mute'}>
					{muted ? '🔈' : '🔊'}
				</button>
				controls here
				<progress ref={refProgress} onPointerDown={onScrubStart} value={0} max={duration}></progress>
				<button onClick={onSave}>save</button>
			</div>
		</div>
	);
}
