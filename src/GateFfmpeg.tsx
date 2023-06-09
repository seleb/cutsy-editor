import { PropsWithChildren, useCallback, useEffect, useState } from 'react';
import { Button } from './Button';
import styles from './GateFfmpeg.module.scss';
import { H } from './H';
import { Loading } from './Loading';
import { Name } from './Name';
import { Page } from './Page';
import { installFfmpeg, isFfmpegInstalled } from './ffmpeg';
import { getErrorMessage } from './getErrorMessage';
import { isDesktop } from './isDesktop';

export function GateFfmpeg({ children }: PropsWithChildren<unknown>) {
	const [gated, setGated] = useState(true);
	const [stateFfmpeg, setStateFfmpeg] = useState<
		'unknown' | 'installing' | 'error' | 'not-installed' | 'installed'
	>('unknown');
	const [installError, setInstallError] = useState('');

	useEffect(() => {
		if (!isDesktop) return;
		(async () => {
			try {
				if (await isFfmpegInstalled()) {
					setStateFfmpeg('installed');
					setGated(false);
				} else {
					setStateFfmpeg('not-installed');
				}
			} catch (err) {
				console.error(err);
				setStateFfmpeg('error');
				setInstallError(getErrorMessage(err));
			}
		})();
	}, []);

	const onInstallFfmpeg = useCallback(async () => {
		if (stateFfmpeg !== 'not-installed')
			throw new Error(`can't install in this state: ${stateFfmpeg}`);
		setStateFfmpeg('installing');
		try {
			await installFfmpeg();
			setStateFfmpeg('installed');
		} catch (err) {
			console.error(err);
			setStateFfmpeg('error');
			setInstallError(getErrorMessage(err));
		}
	}, [stateFfmpeg]);

	const onContinue = useCallback(() => {
		setGated(false);
	}, []);

	return !gated ? (
		(children as JSX.Element | null)
	) : (
		<Page className={styles.container}>
			<H>
				<Name /> setup
			</H>
			<section className={styles.splash}>
				<Loading
					loading={stateFfmpeg === 'unknown' || stateFfmpeg === 'installing'}
					msgLoading={
						stateFfmpeg === 'unknown' ? (
							<>
								checking <strong>ffmpeg</strong> installation...
							</>
						) : (
							<>
								installing <strong>ffmpeg</strong> (this may take a few
								minutes)...
							</>
						)
					}
					error={stateFfmpeg === 'not-installed' || stateFfmpeg === 'error'}
					msgError={
						installError ? (
							<>
								<p>something went wrong with ffmpeg!</p>
								<p>
									this may be a permissions issue: try running this setup as an
									admin or{' '}
									<a
										href="https://ffmpeg.org/download.html"
										target="_blank"
										rel="noreferrer"
									>
										installing ffmpeg
									</a>{' '}
									on your own
								</p>
								<pre>{installError}</pre>
							</>
						) : (
							<>
								<p>
									this app requires{' '}
									<a href="https://ffmpeg.org" target="_blank" rel="noreferrer">
										ffmpeg
									</a>{' '}
									in order to edit clips.
								</p>
								<Button onClick={onInstallFfmpeg}>install ffmpeg for me</Button>
							</>
						)
					}
				>
					<p>
						<strong>ffmpeg</strong> is ready!
					</p>
					<Button onClick={onContinue}>continue</Button>
				</Loading>
			</section>
		</Page>
	);
}
