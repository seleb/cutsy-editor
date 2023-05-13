import { faArrowDownUpAcrossLine, faBug, faFilm, faFolder, faGear, faMapPin, faPause, faPhotoFilm, faPlay, faSortAlphaAsc, faSortAlphaDesc, faVolumeHigh, faVolumeXmark } from '@fortawesome/free-solid-svg-icons';
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
}

export const Icon = forwardRef(({
	icon, 
	...props
}: Omit<ComponentProps<typeof FontAwesomeIcon>, 'icon'> & {
	icon: keyof typeof icons;
}, ref: ForwardedRef<SVGSVGElement>) => {
	return <FontAwesomeIcon ref={ref} icon={icons[icon]} {...props} />
})
