import { invoke } from '@tauri-apps/api/tauri';
import { PropsWithChildren, useCallback, useEffect, useState } from 'react';
import { Button } from './Button';
import { Clilp } from './Clilp';
import styles from './GateFfmpeg.module.scss';
import { H } from './H';
import { Loading } from './Loading';
import { Page } from './Page';
import { getErrorMessage } from './getErrorMessage';
import { isDesktop } from './isDesktop';

export function GateFfmpeg({ children }: PropsWithChildren<{}>) {
	const [gated, setGated] = useState(true);
	const [stateFfmpeg, setStateFfmpeg] = useState<'unknown' | 'installing' | 'error' | 'not-installed' | 'installed'>('unknown');
	const [installError, setInstallError] = useState('');

	useEffect(() => {
		if (!isDesktop) return;
		(async () => {
			const isFfmpegInstalled = await invoke('is_ffmpeg_installed');
			if (isFfmpegInstalled) {
				setStateFfmpeg('installed');
				setGated(false);
			} else {
				setStateFfmpeg('not-installed');
			}
		})();
	}, []);

	const installFfmpeg = useCallback(async () => {
		if (stateFfmpeg !== 'not-installed') throw new Error(`Can't install in this state: ${stateFfmpeg}`);
		setStateFfmpeg('installing');
		try {
			await invoke('install_ffmpeg');
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
		<>{children}</>
	) : (
		<Page className={styles.container}>
			<H>
				<Clilp /> setup
			</H>
			<section className={styles.splash}>
				<Loading
					loading={stateFfmpeg === 'unknown' || stateFfmpeg === 'installing'}
					msgLoading={
						stateFfmpeg === 'unknown' ? (
							<>
								Checking <strong>ffmpeg</strong> installation...
							</>
						) : (
							<>
								Installing <strong>ffmpeg</strong> (this may take a few minutes)...
							</>
						)
					}
					error={stateFfmpeg === 'not-installed' || stateFfmpeg === 'error'}
					msgError={
						installError || (
							<>
								<p>
									This app requires{' '}
									<a href="https://ffmpeg.org" target="_blank">
										ffmpeg
									</a>{' '}
									in order to edit clips.
								</p>
								<Button onClick={installFfmpeg}>Install ffmpeg for me</Button>
							</>
						)
					}
				>
					<p><strong>ffmpeg</strong> is ready!</p>
					<Button onClick={onContinue}>Continue</Button>
				</Loading>
			</section>
		</Page>
	);
}
