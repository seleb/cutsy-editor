import { FileEntry, readDir } from '@tauri-apps/api/fs';
import { BaseDirectory } from '@tauri-apps/api/path';
import { convertFileSrc } from '@tauri-apps/api/tauri';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { H } from './H';
import { Loading } from './Loading';
import { Page } from './Page';
import styles from './ViewVideos.module.scss';
import usePagination from './usePagination';

let obj = document.createElement('video');
function isVideo(path: string) {
	return obj.canPlayType(`video/${path.split('.').pop()?.toLowerCase()}`) !== '';
}

function Video({ path, name }: FileEntry) {
	const src = useMemo(() => convertFileSrc(path), [path]);
	const encoded = useMemo(() => encodeURIComponent(src), [src]);
	return (
		<Link to={`/edit?v=${encoded}`}>
			<video aria-hidden="true" preload="metadata" src={`${src}`}></video>
			<span>{name}</span>
		</Link>
	);
}
const videosPerPage = 10;

export function ViewVideos() {
	const [library, setLibrary] = useState<FileEntry[]>([]);
	useEffect(() => {
		(async () => {
			const dir = await readDir('.', { dir: BaseDirectory.Video, recursive: true });
			const flatten = (dir: FileEntry): FileEntry[] => (dir.children ? dir.children.flatMap(flatten) : [dir]);
			setLibrary(dir.flatMap(flatten).filter(i => isVideo(i.path)));
		})();
	}, []);
	const loadMoreVideos = useCallback(
		async (last: readonly FileEntry[]) => {
			let lastIdx = library.indexOf(last[last.length-1]);
			lastIdx = lastIdx === -1 ? 0 : lastIdx + 1;
			return library.slice(lastIdx, lastIdx + videosPerPage);
		},
		[library]
	);
	const { items: videos, loading, error, hasMore, loadMore } = usePagination<FileEntry>(loadMoreVideos, videosPerPage);
	return (
		<Page>
			<H>videos</H>
			<div>{videos.length} / {library.length}</div>
			<Loading loading={loading} msgLoading="Loading videos..." error={error} msgError="Failed to load videos :(" count={videos.length} msgNone="No videos ¯\_(ツ)_/¯">
				<ul className={styles.videos}>
					{videos.map(video => (
						<li key={video.path}>
							<Video name={video.name} path={video.path} />
						</li>
					))}
				</ul>
				{hasMore && <button onClick={loadMore}>Load more</button>}
			</Loading>
		</Page>
	);
}
