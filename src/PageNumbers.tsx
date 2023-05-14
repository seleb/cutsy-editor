import { ComponentProps, useCallback } from 'react';

import { Icon } from './Icon';
import styles from './PageNumbers.module.scss';

const pad = 2;

export function PageNumbers({ goto, current = 0, total, className, ...props }: ComponentProps<'nav'> & { goto: (page: number) => void; current?: number; total: number }) {
	const onClick = useCallback<NonNullable<ComponentProps<'button'>['onClick']>>(
		event => goto(parseInt(event.currentTarget.value, 10)),
		[goto]
	);
	const jump = useCallback<NonNullable<ComponentProps<'button'>['onClick']>>(async () => {
		const page = prompt('Enter a page number');
		return goto(parseInt(page || '', 10) - 1);
	}, [goto]);
	return (
		<nav className={`${className} ${styles.container}`} {...props}>
			<button className={`${styles.button} ${styles.prev}`} onClick={onClick} disabled={current <= 0} value={current - 1} title="Previous page">
				<Icon icon="<" />
			</button>
			<button className={`${styles.button} ${styles.first}`} onClick={onClick} disabled={current <= pad} value={0} title="First page">
				{1}
			</button>
			{new Array(pad).fill(0).map((_, idx, a) => (
				<button key={idx} className={`${styles.button} ${styles.pad}`} onClick={onClick} disabled={current <= a.length - idx - 1} value={current - (a.length - idx)}>
					{current + 1 - (a.length - idx)}
				</button>
			))}
			<button className={`${styles.button} ${styles.current}`} onClick={jump} disabled={total <= 1} title="Jump to page">
				{current + 1}
			</button>
				<span className={`${styles.button} ${styles.total}`}>
					/&nbsp;{total}
				</span>
			{new Array(pad).fill(0).map((_, idx) => (
				<button key={idx} className={`${styles.button} ${styles.pad}`} onClick={onClick} disabled={current >= total - idx - 1} value={current + (idx + 1)}>
					{current + 1 + (idx + 1)}
				</button>
			))}
			<button className={`${styles.button} ${styles.last}`} onClick={onClick} disabled={current >= total - pad - 1} value={total - 1} title="Last page">
				{total}
			</button>
			<button className={`${styles.button} ${styles.next}`} onClick={onClick} disabled={current >= total - 1} value={current + 1} title="Next page">
				<Icon icon=">" />
			</button>
		</nav>
	);
}
