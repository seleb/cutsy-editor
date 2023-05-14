import { Icon } from './Icon';
import { Page } from './Page';
import { PageHeader } from './PageHeader';
import { Spinner } from './Spinner';

import styles from './ViewQueue.module.scss';

export function ViewQueue() {
	return (
		<Page>
			<PageHeader>queue</PageHeader>
			<ol className={styles.queue}>
				{[
					{ input: 'test test test test.mp4', output: 'test test test test' },
					{ input: 'test test test test1.mp4', output: 'test test test test2' },
					{ input: 'test test test test4.mp4', output: 'test test test test3' },
				].map(({ input, output }, idx) => (
					<li key={`${input}-${output}`}>
						{input} <Icon icon=">" /> {output}
						{idx === 0 && <Spinner className={styles.spinner} />}
					</li>
				))}
			</ol>
		</Page>
	);
}
