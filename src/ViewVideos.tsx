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
import { Icon } from './Icon';

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
				const files = dir.flatMap(flatten).filter(i => isVideo(i.path));
				setLibrary(files);
				setResults(files);
				search.addDocuments(files);
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
		const numPage = parseInt(page || '0', 10);
		if (Number.isNaN(numPage)) return 0;
		return numPage;
	}, [page]);

	const [sort, setSort] = useState<'sortAsc' | 'sortDesc' | 'sortNone'>('sortNone');
	const cycleSort = useCallback(() => {
		setSort(
			s =>
				((
					{
						sortAsc: 'sortDesc',
						sortDesc: 'sortNone',
						sortNone: 'sortAsc',
					} as const
				)[s])
		);
	}, []);
	const sorted = useMemo(() => {
		if (sort === 'sortNone') return results;
		const sorted = results.slice();
		sorted.sort(({ name: a = '' }, { name: b = '' }) => a?.localeCompare(b, undefined, { sensitivity: 'base' }));
		if (sort === 'sortDesc') sorted.reverse();
		return sorted;
	}, [results, sort]);

	const { totalPages, startIndex, endIndex, setPage } = usePagination({
		totalItems: sorted.length,
		initialPage: numPage,
		initialPageSize: videosPerPage,
	});
	useLayoutEffect(() => {
		setPage(numPage);
	}, [numPage, totalPages]);

	const navigate = useNavigate();
	const goto = useCallback(
		(newPage: number) => {
			if (Number.isNaN(newPage)) return;
			navigate(`/videos/${newPage}`);
		},
		[navigate]
	);

	const onSearch = useCallback<ChangeEventHandler<HTMLInputElement>>(
		event => {
			const search = refSearch.current;
			if (!search) return;
			const query = event.currentTarget.value;
			if (!query) {
				setResults(library);
				navigate('/videos/0', { replace: true });
				return;
			}
			const files = search.search(event.currentTarget.value) as FileEntry[];
			setResults(files);
			navigate('/videos/0', { replace: true });
		},
		[library]
	);

	return (
		<Page>
			<Title>videos</Title>
			<PageHeader>
				<H>
					videos ({results.length}/{library.length})
				</H>
				<datalist id="list-videos">
					{library.map(i => (
						<option key={i.path} value={i.name} />
					))}
				</datalist>
				<input type="text" list="list-videos" placeholder="Search..." onChange={onSearch} />
				<button
					title={
						{
							sortAsc: 'Sort alphabetical (ascending)',
							sortDesc: 'Sort alphabetical (descending)',
							sortNone: 'No sort (system order)',
						}[sort]
					}
					onClick={cycleSort}
				>
					<Icon icon={sort} />
				</button>
				{totalPages > 0 && <PageNumbers goto={goto} current={numPage} total={totalPages} />}
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
					{sorted.slice(startIndex, (endIndex < 0 ? 0 : endIndex) + 1).map(video => (
						<li key={video.path}>
							<Video name={video.name} path={video.path} />
						</li>
					))}
				</ul>
			</Loading>
		</Page>
	);
}
