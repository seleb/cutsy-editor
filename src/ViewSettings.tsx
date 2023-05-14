import { open } from '@tauri-apps/api/dialog';
import { ChangeEventHandler, MouseEventHandler, useCallback } from 'react';
// eslint-disable-next-line import/extensions
import pkg from '../package.json';
import { Button } from './Button';
import {
	availableSettings,
	useSettings,
	useSettingsReset,
	useSettingsSet,
} from './ContextSettings';
import { Debug } from './Debug';
import { Icon } from './Icon';
import { Page } from './Page';
import { PageHeader } from './PageHeader';
import { Title } from './Title';
import styles from './ViewSettings.module.scss';

export function ViewSettings() {
	const settings = useSettings();
	const set = useSettingsSet();
	const reset = useSettingsReset();

	const addFolder = useCallback(async () => {
		const files = await open({
			title: 'Select video folder(s)',
			multiple: true,
			directory: true,
		});
		if (!files || !files.length) return;
		// TODO: save scope
		set('videoFolders', settings.videoFolders.concat(files));
	}, [set, settings.videoFolders]);
	const removeFolder = useCallback<MouseEventHandler<HTMLButtonElement>>(
		(event) => {
			const f = settings.videoFolders.slice();
			f.splice(parseInt(event.currentTarget.value, 10), 1);
			set('videoFolders', f);
		},
		[set, settings.videoFolders]
	);

	const onRadio = useCallback<ChangeEventHandler<HTMLInputElement>>(
		(event) => {
			const el = event.currentTarget as HTMLInputElement;
			// not guaranteed but safe enough
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			if (availableSettings.includes(el.name)) set(el.name, el.value);
		},
		[set]
	);

	const onNumber = useCallback<ChangeEventHandler<HTMLInputElement>>(
		(event) => {
			const el = event.currentTarget as HTMLInputElement;
			// not guaranteed but safe enough
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			if (availableSettings.includes(el.name)) set(el.name, Number(el.value));
		},
		[set]
	);
	return (
		<Page>
			<Title>settings</Title>
			<PageHeader>settings</PageHeader>
			<dl className={styles.settings}>
				<dt>theme</dt>
				<dd>
					<label>
						<input
							onChange={onRadio}
							type="radio"
							name="theme"
							value="auto"
							checked={settings.theme === 'auto'}
						/>{' '}
						auto
					</label>
					<label>
						<input
							onChange={onRadio}
							type="radio"
							name="theme"
							value="dark"
							checked={settings.theme === 'dark'}
						/>{' '}
						dark
					</label>
					<label>
						<input
							onChange={onRadio}
							type="radio"
							name="theme"
							value="light"
							checked={settings.theme === 'light'}
						/>{' '}
						light
					</label>
				</dd>

				<dt>font</dt>
				<dd>
					<label>
						<input
							onChange={onRadio}
							type="radio"
							name="font"
							value="bitch"
							checked={settings.font === 'bitch'}
						/>{' '}
						bitch
					</label>
					<label>
						<input
							onChange={onRadio}
							type="radio"
							name="font"
							value="boring"
							checked={settings.font === 'boring'}
						/>{' '}
						boring
					</label>
				</dd>

				<Debug>
					<dt>video folders</dt>
					<dd>
						<ul className={styles.folders}>
							{settings.videoFolders.map((i, idx) => (
								<li key={i}>
									<button
										type="button"
										onClick={removeFolder}
										value={idx}
										title={`Remove folder "${i}"`}
									>
										{i} <Icon icon="x" />
									</button>
								</li>
							))}
							<li>
								<button type="button" onClick={addFolder}>
									add new folder <Icon icon="+" />
								</button>
							</li>
						</ul>
						<p>
							if no folders are set, your OS default video directory is used
							instead
						</p>
					</dd>
				</Debug>

				<dt>videos per page</dt>
				<dd>
					<input
						type="number"
						name="itemsPerPage"
						value={settings.itemsPerPage}
						onInput={onNumber}
						step={1}
						min={0}
					/>
				</dd>

				<dt>save audio</dt>
				<dd>
					<label>
						<input
							onChange={onRadio}
							type="radio"
							name="saveAudio"
							value="always"
							checked={settings.saveAudio === 'always'}
						/>{' '}
						always export with audio
					</label>
					<label>
						<input
							onChange={onRadio}
							type="radio"
							name="saveAudio"
							value="never"
							checked={settings.saveAudio === 'never'}
						/>{' '}
						never export with audio
					</label>
					<label>
						<input
							onChange={onRadio}
							type="radio"
							name="saveAudio"
							value="editor"
							checked={settings.saveAudio === 'editor'}
						/>{' '}
						respect editor mute button
					</label>
				</dd>

				<dt>open files after saving</dt>
				<dd>
					<label>
						<input
							onChange={onRadio}
							type="radio"
							name="openAfterSave"
							value="true"
							checked={settings.openAfterSave === 'true'}
						/>{' '}
						yes please
					</label>
					<label>
						<input
							onChange={onRadio}
							type="radio"
							name="openAfterSave"
							value="false"
							checked={settings.openAfterSave === 'false'}
						/>{' '}
						no thanks
					</label>
				</dd>

				<dt>reset to default</dt>
				<dd>
					<Button onClick={reset} title="Reset settings">
						<Icon icon="danger" />
					</Button>
				</dd>
			</dl>

			<PageHeader className={styles.abouth}>about</PageHeader>
			<p>
				this is a little editor i made to clip and convert videos in a way that
				i like
			</p>
			<p>if you are using it i hope you like it too :)</p>
			<dl className={styles.about}>
				<dt>version</dt>
				<dd>{pkg.version}</dd>

				<dt>made by</dt>
				<dd>
					<a href="https://seans.site" target="_blank" rel="noreferrer">
						sean
					</a>
				</dd>

				<dt>source</dt>
				<dd>
					<a href={pkg.repository.url} target="_blank" rel="noreferrer">
						{pkg.name}
					</a>
				</dd>
			</dl>
		</Page>
	);
}
