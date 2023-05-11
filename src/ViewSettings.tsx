import pkg from '../package.json';
import { Page } from "./Page";
import { PageHeader } from "./PageHeader";
import { Title } from "./Title";
import styles from './ViewSettings.module.scss';

export function ViewSettings() {
	// TODO: hook up settings
	return (
		<Page>
			<Title>settings</Title>
			<PageHeader>
				settings
			</PageHeader>
			<dl className={styles.settings}>
				<dt>theme</dt>
				<dd>
					<label><input type="radio" name="theme" value="auto" /> auto</label>
					<label><input type="radio" name="theme" value="dark" /> dark</label>
					<label><input type="radio" name="theme" value="light" /> light</label>
				</dd>

				<dt>font</dt>
				<dd>
					<label><input type="radio" name="font" value="Bitch" /> Bitch</label>
					<label><input type="radio" name="font" value="" /> Boring</label>
				</dd>
			</dl>
			<PageHeader>
				about
			</PageHeader>
			<p>
				this is a little editor i made to clip and convert videos in a way that i like
			</p>
			<p>
				if you are using it i hope you like it too :)
			</p>
			<dl className={styles.about}>
				<dt>version</dt>
				<dd>{pkg.version}</dd>

				<dt>made by</dt>
				<dd><a href="https://seans.site" target="_blank">sean</a></dd>

				<dt>source</dt>
				<dd><a href={pkg.repository.url} target="_blank">{pkg.name}</a></dd>
			</dl>
		</Page>
	);
}
