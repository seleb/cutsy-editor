import { PointerEventHandler, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Title } from './Title';
import styles from './ViewEdit.module.scss';
import { clamp } from './clamp';

const FRAMES_PER_SECOND = 60;
const FRAME = 1 / FRAMES_PER_SECOND;

export function ViewEdit() {
	const [search] = useSearchParams();
	const path = search.get('v') || '';
	const src = useMemo(() => decodeURIComponent(path), [path]);

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

	const getSkip = useCallback(({ metaKey, ctrlKey, altKey, shiftKey }: KeyboardEvent) => {
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
	}, [duration]);

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

	if (!path) throw new Error('No video path!');
	return (
		<div className={styles.container}>
			<Title>{['videos', src.split(/[\\\/]/).pop()]}</Title>
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
			</div>
		</div>
	);
}
