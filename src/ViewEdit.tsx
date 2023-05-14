import { convertFileSrc } from '@tauri-apps/api/tauri';
import { MouseEventHandler, PointerEventHandler, WheelEventHandler, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueuePush, useVideo, useVideoSet } from './ContextApp';
import { useSettings } from './ContextSettings';
import { EditorHelp } from './EditorHelp';
import { Icon } from './Icon';
import { Title } from './Title';
import styles from './ViewEdit.module.scss';
import { clamp } from './clamp';
import { FRAME } from './ffmpeg';
import { saveAsImageLocation, saveAsVideoLocation } from './save';
import { toDuration } from './toDuration';

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
	const refPlayhead = useRef<HTMLDivElement>(null);

	const [paused, setPaused] = useState(true);
	const [muted, setMuted] = useState(false);
	const [duration, setDuration] = useState(0);
	const [preview, setPreview] = useState(false);

	const togglePlaying = useCallback(() => {
		setPaused(s => !s);
	}, []);
	const toggleMuted = useCallback(() => {
		setMuted(s => !s);
	}, []);

	const togglePreview = useCallback(() => {
		setPreview(s => {
			setPaused(s);
			return !s;
		});
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

	const getClip = useCallback(() => {
		const elClip = refClip.current;
		if (!elClip) return;
		const start = Number((elClip.style.left || '0%').replace('%', '')) / 100;
		const dur = Number((elClip.style.width || '100%').replace('%', '')) / 100;
		const end = start + dur;
		return [start, end, dur];
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

	// update to preview clip only
	useEffect(() => {
		if (!preview) return;
		let vfc: number;
		const elVideo = refVideo.current;
		if (!elVideo) return;
		const onUpdate: VideoFrameRequestCallback = (_now, metadata) => {
			const clip = getClip();
			if (!clip) return;
			const [start, end] = clip;
			if (metadata.mediaTime < start * elVideo.duration - FRAME || metadata.mediaTime > end * elVideo.duration) {
				elVideo.currentTime = start * elVideo.duration + FRAME;
			}
			vfc = elVideo.requestVideoFrameCallback(onUpdate);
		};
		vfc = elVideo.requestVideoFrameCallback(onUpdate);

		return () => {
			elVideo.cancelVideoFrameCallback(vfc);
		};
	}, [preview]);

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
				return duration * 0.1;
			}
			if (altKey) {
				return duration * 0.05;
			}
			return duration * 0.01;
		},
		[duration]
	);

	const updatePlayhead = useCallback((pos: number) => {
		const elPlayhead = refPlayhead.current;
		if (!elPlayhead) return;
		elPlayhead.style.left = `${clamp(0, pos, 1) * 100}%`;
	}, []);

	const onUpdatePlayhead = useCallback<MouseEventHandler>(
		event => {
			const elPlayhead = refPlayhead.current;
			if (!elPlayhead?.parentElement) return;
			const rect = elPlayhead.parentElement.getBoundingClientRect();
			const pos = (event.pageX - rect.left) / elPlayhead.parentElement.offsetWidth;
			updatePlayhead(pos);
		},
		[updatePlayhead]
	);

	const seek = useCallback(
		(to: number, loop = true) => {
			const elVideo = refVideo.current;
			const elPlayhead = refPlayhead.current;
			const elTime = refTime.current;
			if (!elVideo || !elPlayhead || !elTime || !elVideo?.duration) {
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

			elVideo.currentTime = t;
			elTime.textContent = toDuration(t);
			updatePlayhead(t / elVideo.duration);
			return t;
		},
		[updatePlayhead]
	);

	const seekBy = useCallback((by: number) => {
		const elVideo = refVideo.current;
		if (!elVideo) return;
		seek(elVideo.currentTime + by);
	}, []);

	const centerTrack = useCallback(() => {
		const elVideo = refVideo.current;
		const elTrack = refProgress.current?.parentElement?.parentElement;
		if (!elVideo?.duration || !elTrack) return;
		elTrack.scrollTo({ left: elTrack.scrollWidth * elVideo.currentTime / elVideo.duration - elTrack.offsetWidth/2 });
	}, []);

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
		[]
	);

	const onUpdateClip = useCallback((start?: number, end?: number, slide?: number) => {
		const elClip = refClip.current;
		const clip = getClip();
		if (!elClip || !clip) return;
		const [oldStart, oldEnd] = clip;
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

	const onScrubStartPlayhead = useCallback(
		onScrubStart({
			start: (event: PointerEvent) => {
				if (event.shiftKey) {
					const elVideo = refVideo.current;
					const elProgress = refProgress.current as HTMLProgressElement;
					if (!elVideo || !elVideo?.duration) return;
					event.preventDefault();
					const rect = elProgress.getBoundingClientRect();
					const pos = (event.pageX - rect.left) / elProgress.offsetWidth;
					
					if (event.button && event.button === 2) {
						onUpdateClip(undefined, pos);
					} else {
						onUpdateClip(pos, undefined);
					}
					return false;
				} else {
					return true;
				}
			},
			scrub: (event: PointerEvent) => {
				const elVideo = refVideo.current;
				const elProgress = refProgress.current as HTMLProgressElement;
				if (!elVideo || !elVideo?.duration) return;
				event.preventDefault();
				const rect = elProgress.getBoundingClientRect();
				const pos = (event.pageX - rect.left) / elProgress.offsetWidth;
				setPreview(false);
				seek(pos * elVideo.duration, false);
			},
		}),
		[onUpdateClip]
	);

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
				const clip = getClip();
				if (!elVideo || !elVideo?.duration || !elClip || !elProgress || !clip) return;

				[start, end] = clip;
				target = event.target as Element;
				isStart = elClip.firstChild === target || elClip.firstChild?.contains(target) || false;
				if (event.button && event.button !== 1) {
					event.preventDefault();
					const pos = elVideo.currentTime / elVideo.duration;
					if (isStart) {
						onUpdateClip(pos, undefined)
					} else {
						onUpdateClip(undefined, pos);
					}
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
				if (isStart) {
					onUpdateClip(pos, end)
				} else {
					onUpdateClip(start, pos);
				}
			},
		});
	}, [onUpdateClip]);

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

	const { openAfterSave, saveAudio } = useSettings();

	const queuePush = useQueuePush();

	const onSaveImage = useCallback(
		async () => {
			const output = await saveAsImageLocation(name);
			if (!output) return;
			queuePush({ command: 'vid_to_img', input: pathDecoded, output, time: refVideo.current?.currentTime || 0 })
		},
		[pathDecoded, name, openAfterSave]
	);

	const onSaveClip = useCallback(async () => {
		const elVideo = refVideo.current;
		const elClip = refClip.current;
		const clip = getClip();
		if (!elVideo || !elClip || !clip) throw new Error('Could not find elements');
		const [start, , dur] = clip;
		const output = await saveAsVideoLocation(name);
		if (!output) return;
		queuePush({
			command: 'vid_to_clip',
			input: pathDecoded,
			output,
			start: start * elVideo.duration || 0,
			duration: dur * elVideo.duration || 0,
			audio: {
				always: true,
				never: false,
				editor: !muted,
			}[saveAudio],
		});
	}, [pathDecoded, name, saveAudio, muted, openAfterSave]);

	const noContextMenu = useCallback<MouseEventHandler<SVGSVGElement | HTMLElement>>(event => {
		event.preventDefault();
	}, []);

	// save editor state
	const setVideo = useVideoSet();
	useEffect(() => {
		const elVideo = refVideo.current;
		const elClip = refClip.current;
		if (!elVideo || !elClip) return;
		return () => {
			const clipStart = Number((elClip.style.left || '0%').replace('%', '')) / 100;
			const clipEnd = Number((elClip.style.width || '100%').replace('%', '')) / 100 + clipStart;
			setVideo({
				path: pathEncoded,
				clipStart,
				clipEnd,
			});
		};
	}, [pathEncoded]);

	// reload clip
	const lastVideo = useVideo();
	useEffect(() => {
		onUpdateClip(lastVideo.clipStart, lastVideo.clipEnd);
	}, [lastVideo.clipStart, lastVideo.clipEnd]);

	const [zoom, setZoom] = useState(100);
	const zoomIn = useCallback(() => {
		setZoom(zoom*2);
	}, [zoom]);
	const zoomOut = useCallback(() => {
		if (zoom > 100) {
			setZoom(zoom/2);
		} else {
			setZoom(100);
		}
	}, [zoom]);

	useEffect(() => {
		centerTrack();
	}, [zoom]);

	const onWheel = useCallback<WheelEventHandler<HTMLDivElement>>((event) => {
		if (event.ctrlKey || event.metaKey) {
			if (event.deltaY > 0) {
				zoomOut();
			} else if (event.deltaY < 0) {
				zoomIn();
			}
		} else if (event.deltaY) {
			const elTrack = refProgress.current?.parentElement?.parentElement;
			if (!elTrack) return;
			elTrack.scrollBy({ left: event.deltaY /*elTrack.offsetWidth*/ });
		}
	}, [zoomIn, zoomOut]);

	// keyboard shortcuts
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
					if (event.shiftKey) {
						togglePreview();
					} else {
						togglePlaying();
					}
					event.preventDefault();
					break;
				case 'm':
					toggleMuted();
					event.preventDefault();
					break;
				case '=':
					if (event.ctrlKey || event.metaKey) {
						zoomIn();
						event.preventDefault();
					}
					break;
				case '-':
					if (event.ctrlKey || event.metaKey) {
						zoomOut();
						event.preventDefault();
					}
					break;
				case '0':
					if (event.ctrlKey || event.metaKey) {
						setZoom(100);
						event.preventDefault();
					} else {
						centerTrack();
					}
					break;
				case 's':
					if (event.ctrlKey || event.metaKey) {
						onSaveClip();
						event.preventDefault();
					}
					break;
				default:
					break;
			}
		};
		window.addEventListener('keydown', onKey);
		return () => {
			window.removeEventListener('keydown', onKey);
		};
	}, [getSkip, seekBy, togglePlaying, togglePreview, toggleMuted, zoomIn, zoomOut, centerTrack, onSaveClip]);

	if (!pathEncoded) throw new Error('No video path!');
	return (
		<div className={styles.container}>
			<Title>{['edit', name]}</Title>
			<video ref={refVideo} onClick={togglePlaying} className={styles.video} controls={false} src={src} preload="auto" muted={muted} loop></video>
			<div className={styles.controls}>
				<div className={styles.trackbarscroll} onContextMenu={noContextMenu} onWheel={onWheel}>
					<div className={styles.trackbar} style={{ width: `${zoom}%` }} onContextMenu={noContextMenu} onMouseMove={onUpdatePlayhead}>
						<progress className={styles.progress} ref={refProgress} onPointerDown={onScrubStartPlayhead} value={0} max={duration} onContextMenu={noContextMenu}></progress>
						<div ref={refClip} className={styles.clip} onPointerDown={onScrubStartClip} onContextMenu={noContextMenu}>
							<Icon title="Drag start of clip" icon="pin" className={styles.start} onPointerDown={onScrubStartMarker} onContextMenu={noContextMenu} />
							<Icon title="Drag end of clip" icon="pin" className={styles.end} onPointerDown={onScrubStartMarker} onContextMenu={noContextMenu} />
						</div>
						<div className={styles.playhead} ref={refPlayhead} aria-hidden="true" />
					</div>
				</div>
				<div className={styles.buttons}>
					<button onClick={togglePlaying} title={paused ? 'Play' : 'Pause'}>
						<Icon icon={paused ? 'play' : 'pause'} />
					</button>
					<button onClick={togglePreview} title={preview && !paused ? 'Stop preview' : 'Preview clip'}>
						<Icon icon={preview && !paused ? 'noPreview' : 'preview'} />
					</button>
					<button onClick={toggleMuted} title={muted ? 'Unmute' : 'Mute'}>
						<Icon icon={muted ? 'muted' : 'sound'} />
					</button>
					<span className={styles.time}>
						<span ref={refTime}>{0}</span> /&nbsp;<span>{toDuration(duration)}</span>
					</span>
					<div className={styles.zoom}>
						<button onClick={zoomOut} title="Zoom out">
							<Icon icon="zoomout" />
						</button>
						<span>{zoom}%</span>
						<button onClick={zoomIn} title="Zoom in">
							<Icon icon="zoomin" />
						</button>
					</div>
					<div className={styles.save}>
						<button onClick={onSaveImage} title="Save image">
							<Icon icon="exportImage" />
						</button>
						<button onClick={onSaveClip} title="Save clip">
							<Icon icon="exportClip" />
						</button>
					</div>
				</div>
			</div>
			<EditorHelp />
		</div>
	);
}
