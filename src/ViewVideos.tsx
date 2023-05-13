import { FileEntry, readDir } from '@tauri-apps/api/fs';
import { BaseDirectory } from '@tauri-apps/api/path';
import { convertFileSrc } from '@tauri-apps/api/tauri';
import { ChangeEventHandler, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { usePagination } from 'react-use-pagination';
import { H } from './H';
import { Loading } from './Loading';
import { Page } from './Page';
import { PageHeader } from './PageHeader';
import { PageNumbers } from './PageNumbers';
import { Title } from './Title';
import styles from './ViewVideos.module.scss';

const obj = document.createElement('video');
function isVideo(path: string) {
	return obj.canPlayType(`video/${path.split('.').pop()?.toLowerCase()}`) !== '';
}

function Video({ path, name }: FileEntry) {
	const src = useMemo(() => convertFileSrc(path), [path]);
	const encoded = useMemo(() => encodeURIComponent(path), [src]);
	return (
		<Link to={`/edit?v=${encoded}`}>
			<video aria-hidden="true" preload="metadata" src={src}></video>
			<span>{name}</span>
		</Link>
	);
}
const videosPerPage = 30;

import { AllSubstringsIndexStrategy, Search, UnorderedSearchIndex } from 'js-search';

export function ViewVideos() {
	const { page } = useParams();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [library, setLibrary] = useState<FileEntry[]>([]);
	const [results, setResults] = useState<FileEntry[]>([]);
	const refSearch = useRef<Search>(null);
	useEffect(() => {
		(async () => {
			try {
				setLoading(true);
				const search = new Search('path');
				search.searchIndex = new UnorderedSearchIndex();
				search.indexStrategy = new AllSubstringsIndexStrategy();
				search.addIndex('name');
				search.addIndex('path');
				const dir = await readDir('.', { dir: BaseDirectory.Video, recursive: true });
				const flatten = (dir: FileEntry): FileEntry[] => (dir.children ? dir.children.flatMap(flatten) : [dir]);
				const library = dir.flatMap(flatten).filter(i => isVideo(i.path));
				setLibrary(library);
				setResults(library);
				search.addDocuments(library);
				// @ts-ignore
				refSearch.current = search;
				setLoading(false);
			} catch (err) {
				console.error(err);
				setError(err instanceof Error ? err.message : 'Unknown error');
			}
		})();
	}, []);

	const numPage = useMemo(() => {
		const numPage = parseInt(page || '0', 10)
		if (Number.isNaN(numPage)) return 0;
		return numPage;
	}, [page]);

	const { totalPages, startIndex, endIndex, setPage } = usePagination({
		totalItems: library.length,
		initialPage: numPage,
		initialPageSize: videosPerPage,
	});
	useLayoutEffect(() => {
		setPage(numPage);
	}, [numPage, totalPages]);

	const navigate = useNavigate();
	const goto = useCallback((newPage: number) => {
		if (Number.isNaN(newPage)) return;
		navigate(`/videos/${newPage}`);
	}, [navigate]);

	const onSearch = useCallback<ChangeEventHandler<HTMLInputElement>>((event) => {
		const search = refSearch.current;
		if (!search) return;
		const query = event.currentTarget.value;
		if (!query) {
			setResults(library);
			return;
		};
		const files = search.search(event.currentTarget.value) as FileEntry[];
		setResults(files);
	}, [library]);

	return (
		<Page>
			<Title>videos</Title>
			<PageHeader>
				<H>videos ({results.length}/{library.length})</H>
				<datalist id="list-videos">
					{library.map(i => <option key={i.path} value={i.name} />)}
				</datalist>
				<input type="text" list='list-videos' placeholder='Search...' onChange={onSearch} />
				{totalPages > 0 && (
					<PageNumbers goto={goto} current={numPage} total={totalPages} />
				)}
			</PageHeader>
			<Loading
				loading={loading}
				msgLoading="Loading videos..."
				error={!!error}
				msgError={
					<>
						Failed to load videos :(<pre>{error}</pre>
					</>
				}
				count={results.length}
				msgNone="No videos ¯\_(ツ)_/¯"
			>
				<ul className={styles.videos}>
					{results.slice(startIndex, endIndex < 0 ? 0 : endIndex).map(video => (
						<li key={video.path}>
							<Video name={video.name} path={video.path} />
						</li>
					))}
				</ul>
			</Loading>
		</Page>
	);
}
