import { ComponentProps, useId } from 'react';
import styles from './Spinner.module.scss';

export function Spinner({
	children,
	className,
	...props
}: ComponentProps<'div'>) {
	const id = useId();
	return (
		<div {...props} className={`${className} ${styles.container}`}>
			<progress
				className={styles.spinner}
				aria-labelledby={children ? id : undefined}
				aria-label={children ? undefined : 'Loading'}
			/>
			<span id={id} className={styles.message}>
				{children}
			</span>
		</div>
	);
}
