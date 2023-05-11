import { ComponentProps } from 'react';
import styles from './Clilp.module.scss';

export function Clilp({ className, ...props }: ComponentProps<'strong'>) {
	return (
		<strong {...props} className={`${className} ${styles.name}`}>cli<span>l</span>p</strong>
	);
}
