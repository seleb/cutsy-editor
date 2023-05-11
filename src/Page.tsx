import { ComponentProps } from 'react';
import styles from './Page.module.scss';

export function Page({ className, ...props }: ComponentProps<'div'>) {
	return <section {...props} className={`${className} ${styles.page}`} />;
}
