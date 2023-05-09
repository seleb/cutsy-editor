import { ComponentProps } from 'react';
import styles from './Page.module.scss';

export function Page({ className, ...props }: ComponentProps<'div'>) {
	return <div {...props} className={`${className} ${styles.page}`} />;
}
