import { faBug, faFilm, faFolder, faGear, faPause, faPhotoFilm, faPlay, faVolumeHigh, faVolumeXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ComponentProps } from 'react';

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
}

export function Icon({
	icon, 
	...props
}: Omit<ComponentProps<typeof FontAwesomeIcon>, 'icon'> & {
	icon: keyof typeof icons;
}) {
	return <FontAwesomeIcon icon={icons[icon]} {...props} />
}
