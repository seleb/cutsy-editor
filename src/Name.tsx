import { ComponentProps } from 'react';
import styles from './Name.module.scss';

export function Name({ className, ...props }: ComponentProps<'strong'>) {
	return (
		<strong {...props} className={`${className} ${styles.name}`}>
			cu<span>t</span>sy
		</strong>
	);
}
