import { convertFileSrc } from '@tauri-apps/api/tauri';
import {
	MouseEventHandler,
	PointerEventHandler,
	WheelEventHandler,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueuePush, useVideo, useVideoSet } from './ContextApp';
import { useSettings } from './ContextSettings';
import { EditorHelp } from './EditorHelp';
import { Icon } from './Icon';
import { Spinner } from './Spinner';
import { Title } from './Title';
import styles from './ViewEdit.module.scss';
import { clamp } from './clamp';
import { FRAME } from './ffmpeg';
import { saveAsImageLocation, saveAsVideoLocation } from './save';
import { toDuration } from './toDuration';

export function ViewEdit() {
	const [search] = useSearchParams();
	const path = search.get('v') || '';
	const src = useMemo(() => convertFileSrc(path), [path]);
	const name = useMemo(() => {
		const basename = path.split(/[\\/]/).pop();
		const parts = basename?.split('.');
		parts?.pop();
		return parts?.join('.');
	}, [path]);

	const refVideo = useRef<HTMLVideoElement>(null);
	const refProgress = useRef<HTMLProgressElement>(null);
	const refTime = useRef<HTMLElement>(null);
	const refClip = useRef<HTMLDivElement>(null);
	const refPlayhead = useRef<HTMLDivElement>(null);
	const refCrop = useRef<HTMLButtonElement>(null);

	const [paused, setPaused] = useState(true);
	const [muted, setMuted] = useState(false);
	const [duration, setDuration] = useState(0);
	const [preview, setPreview] = useState(false);

	const togglePlaying = useCallback(() => {
		setPaused((s) => !s);
	}, []);
	const toggleMuted = useCallback(() => {
		setMuted((s) => !s);
	}, []);

	const togglePreview = useCallback(() => {
		setPreview((s) => {
			setPaused(s);
			return !s;
		});
	}, []);

	// get video duration for scrubber
	useEffect(() => {
		const elVideo = refVideo.current;
		if (!elVideo) return undefined;
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
		if (!elClip) return undefined;
		const start = Number((elClip.style.left || '0%').replace('%', '')) / 100;
		const dur = Number((elClip.style.width || '100%').replace('%', '')) / 100;
		const end = start + dur;
		return [start, end, dur];
	}, []);

	const getCrop = useCallback(() => {
		const elCrop = refCrop.current;
		if (!elCrop) return { x: 0, y: 0, w: 1, h: 1 };
		const x = Number(elCrop.dataset.x || '0');
		const y = Number(elCrop.dataset.y || '0');
		const w = Number(elCrop.dataset.w || '1');
		const h = Number(elCrop.dataset.h || '1');
		return { x, y, w, h };
	}, []);

	// update to match video time
	useEffect(() => {
		let vfc: number;
		const elVideo = refVideo.current;
		const elProgress = refProgress.current;
		const elTime = refTime.current;
		if (!elVideo || !elProgress || !elTime) return undefined;

		// update as video frames are available
		const onUpdate: VideoFrameRequestCallback = (_now, metadata) => {
			elProgress.value = metadata.mediaTime;
			elTime.textContent = toDuration(metadata.mediaTime);
			vfc = elVideo.requestVideoFrameCallback(onUpdate);
		};
		vfc = elVideo.requestVideoFrameCallback(onUpdate);

		// update on time events (less frequent, but frame callbacks aren't supported everywhere)
		const onTimeUpdate = () => {
			elProgress.value = elVideo.currentTime;
			elTime.textContent = toDuration(elVideo.currentTime);
		};
		elVideo.addEventListener('timeupdate', onTimeUpdate);

		return () => {
			elVideo.cancelVideoFrameCallback(vfc);
			elVideo.removeEventListener('timeupdate', onTimeUpdate);
		};
	}, []);

	// update to preview clip only
	useEffect(() => {
		if (!preview) return undefined;
		let vfc: number;
		const elVideo = refVideo.current;
		if (!elVideo) return undefined;
		const onUpdate: VideoFrameRequestCallback = (_now, metadata) => {
			const clip = getClip();
			if (!clip) return;
			const [start, end] = clip;
			if (
				metadata.mediaTime < start * elVideo.duration - FRAME ||
				metadata.mediaTime > end * elVideo.duration
			) {
				elVideo.currentTime = start * elVideo.duration + FRAME;
			}
			vfc = elVideo.requestVideoFrameCallback(onUpdate);
		};
		vfc = elVideo.requestVideoFrameCallback(onUpdate);

		return () => {
			elVideo.cancelVideoFrameCallback(vfc);
		};
	}, [getClip, preview]);

	// check if buffering
	useEffect(() => {
		const elVideo = refVideo.current;
		if (!elVideo) return undefined;
		const interval = setInterval(() => {
			elVideo.dataset.networkState = elVideo.networkState.toString(10);
		}, 200);

		return () => clearInterval(interval);
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
		(event) => {
			const elPlayhead = refPlayhead.current;
			if (!elPlayhead?.parentElement) return;
			const rect = elPlayhead.parentElement.getBoundingClientRect();
			const pos =
				(event.pageX - rect.left) / elPlayhead.parentElement.offsetWidth;
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
				return undefined;
			}
			let t: number;
			if (loop && to < 0 && elVideo.currentTime < FRAME * 2) {
				t = elVideo.duration - FRAME;
			} else if (
				loop &&
				to > elVideo.duration &&
				elVideo.currentTime - elVideo.duration > -FRAME * 2
			) {
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

	const seekBy = useCallback(
		(by: number) => {
			const elVideo = refVideo.current;
			if (!elVideo) return;
			seek(elVideo.currentTime + by);
		},
		[seek]
	);

	const centerTrack = useCallback(() => {
		const elVideo = refVideo.current;
		const elTrack = refProgress.current?.parentElement?.parentElement;
		if (!elVideo?.duration || !elTrack) return;
		elTrack.scrollTo({
			left:
				(elTrack.scrollWidth * elVideo.currentTime) / elVideo.duration -
				elTrack.offsetWidth / 2,
		});
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
			(event) => {
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

	const onUpdateCrop = useCallback(
		({
			x1,
			y1,
			x2,
			y2,
		}: {
			x1: number;
			y1: number;
			x2: number;
			y2: number;
		}) => {
			const elCrop = refCrop.current;
			if (!elCrop) return;
			if (x2 < x1) [x1, x2] = [x2, x1];
			if (y2 < y1) [y1, y2] = [y2, y1];
			x1 = clamp(0, x1, 1);
			y1 = clamp(0, y1, 1);
			x2 = clamp(0, x2, 1);
			y2 = clamp(0, y2, 1);
			const w = x2 - x1;
			const h = y2 - y1;
			elCrop.dataset.x = x1.toString(10);
			elCrop.dataset.y = y1.toString(10);
			elCrop.dataset.w = w.toString(10);
			elCrop.dataset.h = h.toString(10);
			elCrop.style.clipPath = `polygon(
				0% 0%, 0% 100%, 100% 100%, 100% 0, 0% 0%,

				${(x1 + 0) * 100}% ${(y1 + 0) * 100}%,
				${(x1 + w) * 100}% ${(y1 + 0) * 100}%,
				${(x1 + w) * 100}% ${(y1 + h) * 100}%,
				${(x1 + 0) * 100}% ${(y1 + h) * 100}%,
				${(x1 + 0) * 100}% ${(y1 + 0) * 100}%
				)`;
		},
		[]
	);

	const onCropStart = useMemo(() => {
		let x1 = 0;
		let y1 = 0;
		let x2: number;
		let y2: number;
		return onScrubStart({
			start: (event: PointerEvent) => {
				const elVideo = refVideo.current;
				const elCrop = refCrop.current;
				if (!elVideo || !elCrop) return;
				event.preventDefault();

				elCrop.style.aspectRatio = `${elVideo.videoWidth} / ${elVideo.videoHeight}`;
				const rect = elCrop.getBoundingClientRect();
				x1 = (event.pageX - rect.left) / elCrop.offsetWidth;
				y1 = (event.pageY - elCrop.offsetTop) / elCrop.offsetHeight;
			},
			scrub: (event: PointerEvent) => {
				const elCrop = refCrop.current;
				if (!elCrop) return;
				event.preventDefault();
				const rect = elCrop.getBoundingClientRect();
				x2 = (event.pageX - rect.left) / elCrop.offsetWidth;
				y2 = (event.pageY - elCrop.offsetTop) / elCrop.offsetHeight;
				if (
					Math.abs(x2 - x1) * elCrop.offsetWidth > 1 &&
					Math.abs(y2 - y1) * elCrop.offsetHeight > 1
				) {
					onUpdateCrop({ x1, y1, x2, y2 });
				}
			},
			end: (event: PointerEvent) => {
				const elCrop = refCrop.current;
				if (!elCrop) return;
				event.preventDefault();
				if (
					!(
						Math.abs((x2 ?? x1) - x1) * elCrop.offsetWidth > 1 &&
						Math.abs((y2 ?? y1) - y1) * elCrop.offsetHeight > 1
					)
				) {
					togglePlaying();
				}
			},
		});
	}, [onScrubStart, onUpdateCrop, togglePlaying]);
	const removeCrop = useCallback(() => {
		onUpdateCrop({ x1: 0, y1: 0, x2: 1, y2: 1 });
	}, [onUpdateCrop]);

	const onUpdateClip = useCallback(
		(start?: number, end?: number, slide?: number) => {
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
			elClip.style.width = `${
				clamp(0, newEnd - newStart, 1 - newStart) * 100
			}%`;
		},
		[getClip]
	);

	const onScrubStartPlayhead = useMemo(
		() =>
			onScrubStart({
				start: (event: PointerEvent) => {
					if (event.shiftKey) {
						const elVideo = refVideo.current;
						const elProgress = refProgress.current as HTMLProgressElement;
						if (!elVideo || !elVideo?.duration) return undefined;
						event.preventDefault();
						const rect = elProgress.getBoundingClientRect();
						const pos = (event.pageX - rect.left) / elProgress.offsetWidth;

						if (event.button && event.button === 2) {
							onUpdateClip(undefined, pos);
						} else {
							onUpdateClip(pos, undefined);
						}
						return false;
					}
					return true;
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
		[onScrubStart, onUpdateClip, seek]
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
				if (!elVideo || !elVideo?.duration || !elClip || !elProgress || !clip)
					return undefined;

				[start, end] = clip;
				target = event.target as Element;
				isStart =
					elClip.firstChild === target ||
					elClip.firstChild?.contains(target) ||
					false;
				if (event.button && event.button !== 1) {
					event.preventDefault();
					const pos = elVideo.currentTime / elVideo.duration;
					if (isStart) {
						onUpdateClip(pos, undefined);
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
				const pos = clamp(
					0,
					(event.pageX - rect.left) / elProgress.offsetWidth,
					1
				);
				seek(pos * elVideo.duration, false);
				if (isStart) {
					onUpdateClip(pos, end);
				} else {
					onUpdateClip(start, pos);
				}
			},
		});
	}, [getClip, onScrubStart, onUpdateClip, seek]);

	const onScrubStartClip = useMemo(
		() =>
			onScrubStart({
				start: (event: PointerEvent) => {
					if (event.target !== refClip.current) return false;
					return undefined;
				},
				scrub: (event: PointerEvent) => {
					const elProgress = refProgress.current as HTMLProgressElement;
					const elClip = refProgress.current as HTMLProgressElement;
					if (!elProgress || !elClip) return;
					event.preventDefault();
					const rect = elClip.getBoundingClientRect();
					if (
						(event.movementX < 0 && event.pageX > rect.right) ||
						(event.movementX > 0 && event.pageX < rect.left)
					)
						return;
					onUpdateClip(
						undefined,
						undefined,
						event.movementX / elProgress.offsetWidth
					);
				},
			}),
		[onScrubStart, onUpdateClip]
	);

	const { saveAudio } = useSettings();

	const queuePush = useQueuePush();

	const onSaveImage = useCallback(async () => {
		const output = await saveAsImageLocation(name);
		if (!output) return;
		queuePush({
			command: 'vid_to_img',
			input: path,
			output,
			time: refVideo.current?.currentTime || 0,
			...getCrop(),
		});
	}, [name, queuePush, path, getCrop]);

	const onSaveClip = useCallback(async () => {
		const elVideo = refVideo.current;
		const elClip = refClip.current;
		const clip = getClip();
		if (!elVideo || !elClip || !clip)
			throw new Error('Could not find elements');
		const [start, , dur] = clip;
		const output = await saveAsVideoLocation(name);
		if (!output) return;
		queuePush({
			command: 'vid_to_clip',
			input: path,
			output,
			start: start * elVideo.duration || 0,
			duration: dur * elVideo.duration || 0,
			audio: {
				always: true,
				never: false,
				editor: !muted,
			}[saveAudio],
			...getCrop(),
		});
	}, [getClip, getCrop, name, queuePush, path, muted, saveAudio]);

	const noContextMenu = useCallback<
		MouseEventHandler<SVGSVGElement | HTMLElement>
	>((event) => {
		event.preventDefault();
	}, []);

	// save editor state
	const setVideo = useVideoSet();
	useEffect(() => {
		const elVideo = refVideo.current;
		const elClip = refClip.current;
		if (!elVideo || !elClip) return undefined;
		return () => {
			const clipStart =
				Number((elClip.style.left || '0%').replace('%', '')) / 100;
			const clipEnd =
				Number((elClip.style.width || '100%').replace('%', '')) / 100 +
				clipStart;
			setVideo({
				path,
				clipStart,
				clipEnd,
			});
		};
	}, [path, setVideo, getCrop]);

	// reload clip
	const lastVideo = useVideo();
	useEffect(() => {
		onUpdateClip(lastVideo.clipStart, lastVideo.clipEnd);
	}, [lastVideo.clipStart, lastVideo.clipEnd, onUpdateClip]);

	const [zoom, setZoom] = useState(100);
	const zoomIn = useCallback(() => {
		setZoom(zoom * 2);
	}, [zoom]);
	const zoomOut = useCallback(() => {
		if (zoom > 100) {
			setZoom(zoom / 2);
		} else {
			setZoom(100);
		}
	}, [zoom]);

	useEffect(() => {
		centerTrack();
	}, [centerTrack, zoom]);

	const onWheel = useCallback<WheelEventHandler<HTMLDivElement>>(
		(event) => {
			if (event.ctrlKey || event.metaKey) {
				if (event.deltaY > 0) {
					zoomOut();
				} else if (event.deltaY < 0) {
					zoomIn();
				}
			} else if (event.deltaY) {
				const elTrack = refProgress.current?.parentElement?.parentElement;
				if (!elTrack) return;
				elTrack.scrollBy({ left: event.deltaY });
			}
		},
		[zoomIn, zoomOut]
	);

	// keyboard shortcuts
	useEffect(() => {
		const onKey = (event: KeyboardEvent) => {
			const { key } = event;
			switch (key) {
				case 'ArrowRight':
					seekBy(getSkip(event) * (100 / zoom));
					event.preventDefault();
					break;
				case 'ArrowLeft':
					seekBy(-getSkip(event) * (100 / zoom));
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
				case '[': {
					const clip = getClip();
					if (!clip) return;
					const [start] = clip;
					seek(start * duration);
					event.preventDefault();
					break;
				}
				case ']': {
					const clip = getClip();
					if (!clip) return;
					const [, end] = clip;
					seek(end * duration);
					event.preventDefault();
					break;
				}
				case ' ':
					if (event.ctrlKey || event.metaKey) {
						const clip = getClip();
						if (!clip) return;
						const [start] = clip;
						seek(start * duration);
						setPreview(true);
						setPaused(false);
					} else if (event.shiftKey) {
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
					}
					break;
				case 'c':
					centerTrack();
					event.preventDefault();
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
	}, [
		getSkip,
		seekBy,
		togglePlaying,
		togglePreview,
		toggleMuted,
		zoom,
		zoomIn,
		zoomOut,
		centerTrack,
		onSaveClip,
		getClip,
		seek,
		duration,
	]);

	if (!path) throw new Error('No video path!');
	return (
		<div className={styles.container}>
			<Title>{['edit', name]}</Title>
			<div className={styles.videocontainer}>
				<video
					ref={refVideo}
					onPointerDown={onCropStart}
					className={styles.video}
					controls={false}
					src={src}
					preload="auto"
					muted={muted}
					loop
				/>
				<button
					ref={refCrop}
					type="button"
					className={styles.crop}
					aria-label="Remove crop"
					title="Remove crop"
					onClick={removeCrop}
				/>
			</div>
			<div className={styles.controls}>
				<Spinner className={styles.spinner}>buffering</Spinner>
				<div
					className={styles.trackbarscroll}
					onContextMenu={noContextMenu}
					onWheel={onWheel}
				>
					<div
						className={styles.trackbar}
						style={{ width: `${zoom}%` }}
						onContextMenu={noContextMenu}
						onMouseMove={onUpdatePlayhead}
					>
						<progress
							className={styles.progress}
							ref={refProgress}
							onPointerDown={onScrubStartPlayhead}
							value={0}
							max={duration}
							onContextMenu={noContextMenu}
						/>
						<div
							ref={refClip}
							className={styles.clip}
							onPointerDown={onScrubStartClip}
							onContextMenu={noContextMenu}
						>
							<Icon
								title="Drag start of clip"
								icon="pin"
								className={styles.start}
								onPointerDown={onScrubStartMarker}
								onContextMenu={noContextMenu}
							/>
							<Icon
								title="Drag end of clip"
								icon="pin"
								className={styles.end}
								onPointerDown={onScrubStartMarker}
								onContextMenu={noContextMenu}
							/>
						</div>
						<div
							className={styles.playhead}
							ref={refPlayhead}
							aria-hidden="true"
						/>
					</div>
				</div>
				<div className={styles.buttons}>
					<button
						type="button"
						onClick={togglePlaying}
						title={paused ? 'Play' : 'Pause'}
					>
						<Icon icon={paused ? 'play' : 'pause'} />
					</button>
					<button
						type="button"
						onClick={togglePreview}
						title={preview && !paused ? 'Stop preview' : 'Preview clip'}
					>
						<Icon icon={preview && !paused ? 'noPreview' : 'preview'} />
					</button>
					<button
						type="button"
						onClick={toggleMuted}
						title={muted ? 'Unmute' : 'Mute'}
					>
						<Icon icon={muted ? 'muted' : 'sound'} />
					</button>
					<span className={styles.time}>
						<span ref={refTime}>{0}</span> /&nbsp;
						<span>{toDuration(duration)}</span>
					</span>
					<div className={styles.zoom}>
						<button type="button" onClick={zoomOut} title="Zoom out">
							<Icon icon="zoomout" />
						</button>
						<span>{zoom}%</span>
						<button type="button" onClick={zoomIn} title="Zoom in">
							<Icon icon="zoomin" />
						</button>
					</div>
					<div className={styles.save}>
						<button type="button" onClick={onSaveImage} title="Save image">
							<Icon icon="exportImage" />
						</button>
						<button type="button" onClick={onSaveClip} title="Save clip">
							<Icon icon="exportClip" />
						</button>
					</div>
				</div>
			</div>
			<EditorHelp />
		</div>
	);
}
