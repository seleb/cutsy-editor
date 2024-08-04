import { ComponentProps } from 'react';
import { useSettings } from './ContextSettings';
import styles from './Page.module.scss';

export function Page({ className, ...props }: ComponentProps<'div'>) {
	return (
		<>
			<style>{useSettings().customCss}</style>
			<section {...props} className={`${className} ${styles.page}`} />
		</>
	);
}
