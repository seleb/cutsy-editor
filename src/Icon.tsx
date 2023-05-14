import { faAngleLeft, faAngleRight, faArrowDownUpAcrossLine, faBug, faEye, faEyeLowVision, faFileArrowUp, faFilm, faFolder, faGear, faMagnifyingGlass, faMapPin, faPause, faPhotoFilm, faPlay, faPlus, faQuestion, faScissors, faSortAlphaAsc, faSortAlphaDesc, faTriangleExclamation, faVolumeHigh, faVolumeXmark, faX } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ComponentProps, ForwardedRef, forwardRef } from 'react';

const icons = {
	'play': faPlay,
	'pause': faPause,
	'muted': faVolumeXmark,
	'sound': faVolumeHigh,
	'exportImage': faPhotoFilm,
	'exportClip': faFilm,
	'videos': faFolder,
	'settings': faGear,
	'debug': faBug,
	'pin': faMapPin,
	'sortAsc': faSortAlphaAsc,
	'sortDesc': faSortAlphaDesc,
	'sortNone': faArrowDownUpAcrossLine,
	'open': faFileArrowUp,
	'search': faMagnifyingGlass,
	'danger': faTriangleExclamation,
	'edit': faScissors,
	'preview': faEye,
	'noPreview': faEyeLowVision,
	'x': faX,
	'?': faQuestion,
	'+': faPlus,
	'<': faAngleLeft,
	'>': faAngleRight,
}

export const Icon = forwardRef(({
	icon, 
	...props
}: Omit<ComponentProps<typeof FontAwesomeIcon>, 'icon'> & {
	icon: keyof typeof icons;
}, ref: ForwardedRef<SVGSVGElement>) => {
	return <FontAwesomeIcon ref={ref} icon={icons[icon]} {...props} />
})
