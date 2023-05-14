import { useQueue } from './ContextApp';
import { Icon } from './Icon';
import { Page } from './Page';
import { PageHeader } from './PageHeader';
import { Spinner } from './Spinner';

import styles from './ViewQueue.module.scss';
import { toDuration } from './toDuration';

export function ViewQueue() {
	const queue = useQueue();
	return (
		<Page>
			<PageHeader>queue</PageHeader>
			{queue.length > 0 ? <table className={styles.queue}>
				<thead>
					<tr>
						<th>input</th>
						<th>output</th>
						<th>time</th>
						<th>audio</th>
						<th>active</th>
					</tr>
				</thead>
				<tbody>
					{queue.map((command, idx) => {
						const time = command.command === 'vid_to_img' ? toDuration(command.time) : `${toDuration(command.start)}-${toDuration(command.start + command.duration)}`;
						const audio = command.command === 'vid_to_clip' && command.audio;
						return (
							<tr key={`${command.input}-${command.output}`}>
								<td title={command.input}>{command.input}</td>
								<td title={command.output}>{command.output}</td>
								<td title={time}>{time}</td>
								<td>
									<Icon title={audio ? 'Sound' : 'Muted'} icon={audio ? 'sound' : 'muted'} />
								</td>
								<td>{idx === 0 && <Spinner className={styles.spinner} />}</td>
							</tr>
						);
					})}
				</tbody>
			</table> : <p>there's nothing in the queue :)</p>}
		</Page>
	);
}
