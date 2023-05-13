import { ComponentProps } from "react";

import styles from './Button.module.scss';

export function Button({
	className,
	children,
	...props
}: ComponentProps<'button'>) {
	return <button className={`${className} ${styles.button}`} {...props}>{children}</button>
}
