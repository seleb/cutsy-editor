import { ComponentProps } from 'react';
import styles from './PageHeader.module.scss';

export function PageHeader({
	className,
	children,
	...props
}: ComponentProps<'header'>) {
	return (
		<header className={`${className} ${styles.header}`} {...props}>
			{children}
		</header>
	);
}
