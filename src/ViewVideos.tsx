import { FileEntry, readDir } from '@tauri-apps/api/fs';
import { BaseDirectory } from '@tauri-apps/api/path';
import { convertFileSrc } from '@tauri-apps/api/tauri';
import {
	ChangeEventHandler,
	MouseEventHandler,
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { usePagination } from 'react-use-pagination';
import { open } from '@tauri-apps/api/shell';
import {
	AllSubstringsIndexStrategy,
	Search,
	UnorderedSearchIndex,
} from 'js-search';
import { H } from './H';
import { Loading } from './Loading';
import { Page } from './Page';
import { PageHeader } from './PageHeader';
import { PageNumbers } from './PageNumbers';
import { Title } from './Title';
import styles from './ViewVideos.module.scss';
import { useSettings } from './ContextSettings';
import { Icon } from './Icon';
import { getErrorMessage } from './getErrorMessage';
import { isVideo } from './isVideo';
import { toEditUrl } from './toEditUrl';
import { usePrevious } from './usePrevious';

function Video({ path, name }: FileEntry) {
	const src = useMemo(() => convertFileSrc(path), [path]);
	const to = useMemo(() => toEditUrl(path), [path]);
	const openInFolder = useCallback<MouseEventHandler>(
		async (event) => {
			event.preventDefault();
			open(
				`file:///${path
					.replace(/(?:.(?![\\/]))+$/, '')
					.replace(/([\\/])\.[\\/]/g, '$1')
					.replace(/([\\/])\.$/, '$1')}`
			);
		},
		[path]
	);
	return (
		<Link to={to}>
			<video aria-hidden="true" preload="metadata" src={src} />
			<span>{name}</span>
			{/* button has title */}
			{/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
			<button type="button" title="Open in folder" onClick={openInFolder}>
				<Icon icon="videos" />
			</button>
		</Link>
	);
}
export function ViewVideos() {
	const { videoFolders, itemsPerPage } = useSettings();
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
				let dirs: FileEntry[][];
				if (videoFolders.length) {
					dirs = await Promise.all(
						videoFolders.map((i) => readDir(i, { recursive: true }))
					);
				} else {
					dirs = [
						await readDir('.', { dir: BaseDirectory.Video, recursive: true }),
					];
				}
				const flatten = (dir: FileEntry): FileEntry[] =>
					dir.children ? dir.children.flatMap(flatten) : [dir];
				const files = dirs
					.flatMap((i) => i.flatMap(flatten))
					.filter((i) => isVideo(i.path));
				setLibrary(files);
				setResults(files);
				search.addDocuments(files);
				// TS makes refs readonly, but this is written imperatively on purpose
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				refSearch.current = search;
				setLoading(false);
			} catch (err) {
				console.error(err);
				setError(getErrorMessage(err));
			}
		})();
	}, [videoFolders]);

	const numPage = useMemo(() => {
		const num = parseInt(page || '0', 10);
		if (Number.isNaN(num)) return 0;
		return num;
	}, [page]);

	const [sort, setSort] = useState<'sortAsc' | 'sortDesc' | 'sortNone'>(
		'sortNone'
	);
	const cycleSort = useCallback(() => {
		setSort(
			(s) =>
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
		const copy = results.slice();
		copy.sort(({ name: a = '' }, { name: b = '' }) =>
			a?.localeCompare(b, undefined, { sensitivity: 'base' })
		);
		if (sort === 'sortDesc') copy.reverse();
		return copy;
	}, [results, sort]);

	const { totalPages, startIndex, endIndex, setPage } = usePagination({
		totalItems: sorted.length,
		initialPage: numPage,
		initialPageSize: itemsPerPage || 1,
	});
	useLayoutEffect(() => {
		setPage(numPage);
	}, [numPage, setPage, totalPages]);

	const navigate = useNavigate();
	const goto = useCallback(
		(newPage: number) => {
			if (Number.isNaN(newPage)) return;
			navigate(`/videos/${newPage}`);
		},
		[navigate]
	);

	const onSearch = useCallback<ChangeEventHandler<HTMLInputElement>>(
		(event) => {
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
		[library, navigate]
	);

	// scroll down if going back 1 page,
	// otherwise scroll up if changing page
	const lastPage = usePrevious(numPage) || -1;
	useEffect(() => {
		if (Math.abs(numPage - lastPage) === 1 && numPage < lastPage) {
			document.documentElement.scrollTo({
				top: document.documentElement.scrollHeight,
			});
		} else if (numPage !== lastPage) {
			document.documentElement.scrollTo({ top: 0 });
		}
	}, [numPage, lastPage]);

	return (
		<Page>
			<Title>videos</Title>
			<PageHeader className={styles.header}>
				<H className={styles.h}>videos</H>

				<datalist id="list-videos">
					{library.map((i) => (
						// datalist doesn't need label
						// eslint-disable-next-line jsx-a11y/control-has-associated-label
						<option key={i.path} value={i.name} />
					))}
				</datalist>
				<div className={styles.search}>
					<Icon icon="search" />
					<input
						type="text"
						list="list-videos"
						placeholder="Search..."
						onChange={onSearch}
					/>
				</div>

				<span className={styles.count}>
					{results.length
						.toString(10)
						.padStart(library.length.toString(10).length, '0')}{' '}
					/&nbsp;{library.length}
				</span>
				<button
					type="button"
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

				{totalPages > 0 && (
					<PageNumbers
						className={styles.numbers}
						goto={goto}
						current={numPage}
						total={totalPages}
					/>
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
					{sorted
						.slice(startIndex, (endIndex < 0 ? 0 : endIndex) + 1)
						.map((video) => (
							<li key={video.path}>
								<Video name={video.name} path={video.path} />
							</li>
						))}
				</ul>
			</Loading>
		</Page>
	);
}
