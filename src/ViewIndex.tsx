import { invoke } from '@tauri-apps/api/tauri';
import { useCallback, useEffect, useState } from 'react';
import { Clilp } from './Clilp';
import { H } from './H';
import { Loading } from './Loading';
import { Page } from './Page';
import styles from './ViewIndex.module.scss';
import { isDesktop } from './isDesktop';
import { useFullscreenToggle } from './useFullscreenToggle';

export function ViewIndex() {
	const [stateFfmpeg, setStateFfmpeg] = useState<'unknown' | 'installing' | 'error' | 'not-installed' | 'installed'>('unknown');
	const [installError, setInstallError] = useState('');

	useEffect(() => {
		if (!isDesktop) return;
		(async () => {
			const isFfmpegInstalled = await invoke('is_ffmpeg_installed');
			if (isFfmpegInstalled) {
				setStateFfmpeg('installed');
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
			if (!(err instanceof Error)) throw err;
			setInstallError(err.message);
		}
	}, [stateFfmpeg]);

	useFullscreenToggle();

	return (
		<Page className={styles.container}>
			<H>
				<Clilp /> is setting up...
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
								<button onClick={installFfmpeg}>Install ffmpeg for me</button>
							</>
						)
					}
				>
					{stateFfmpeg === 'not-installed' ? <button onClick={installFfmpeg}>Install ffmpeg for me</button> : <>ffmpeg is ready!</>}
				</Loading>
			</section>
		</Page>
	);
}
