import {
	faAngleLeft,
	faAngleRight,
	faArrowDownWideShort,
	faArrowUpShortWide,
	faBug,
	faEye,
	faEyeLowVision,
	faFileArrowUp,
	faFilm,
	faFolder,
	faGear,
	faMagnifyingGlass,
	faMagnifyingGlassMinus,
	faMagnifyingGlassPlus,
	faMapPin,
	faPause,
	faPhotoFilm,
	faPlay,
	faPlus,
	faQuestion,
	faRefresh,
	faScissors,
	faTriangleExclamation,
	faVolumeHigh,
	faVolumeXmark,
	faX,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ComponentProps, ForwardedRef, forwardRef } from 'react';

const icons = {
	play: faPlay,
	pause: faPause,
	muted: faVolumeXmark,
	sound: faVolumeHigh,
	exportImage: faPhotoFilm,
	exportClip: faFilm,
	videos: faFolder,
	settings: faGear,
	debug: faBug,
	pin: faMapPin,
	asc: faArrowUpShortWide,
	desc: faArrowDownWideShort,
	open: faFileArrowUp,
	search: faMagnifyingGlass,
	danger: faTriangleExclamation,
	edit: faScissors,
	preview: faEye,
	noPreview: faEyeLowVision,
	zoomin: faMagnifyingGlassPlus,
	zoomout: faMagnifyingGlassMinus,
	x: faX,
	'?': faQuestion,
	'+': faPlus,
	'<': faAngleLeft,
	'>': faAngleRight,
	refresh: faRefresh,
};

export const Icon = forwardRef(
	(
		{
			icon,
			...props
		}: Omit<ComponentProps<typeof FontAwesomeIcon>, 'icon'> & {
			icon: keyof typeof icons;
		},
		ref: ForwardedRef<SVGSVGElement>
	) => <FontAwesomeIcon ref={ref} icon={icons[icon]} {...props} />
);
