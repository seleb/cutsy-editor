import { FileEntry, readDir } from '@tauri-apps/api/fs';
import { BaseDirectory } from '@tauri-apps/api/path';
import { open } from '@tauri-apps/api/shell';
import { convertFileSrc } from '@tauri-apps/api/tauri';
import {
	ChangeEventHandler,
	MouseEventHandler,
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useState,
} from 'react';
import {
	Link,
	useNavigate,
	useParams,
	useSearchParams,
} from 'react-router-dom';
import { usePagination } from 'react-use-pagination';
import { useSearch, useVideos, useVideosSet } from './ContextApp';
import { useSettings } from './ContextSettings';
import { H } from './H';
import { Icon } from './Icon';
import { Loading } from './Loading';
import { Page } from './Page';
import { PageHeader } from './PageHeader';
import { PageNumbers } from './PageNumbers';
import { Title } from './Title';
import styles from './ViewVideos.module.scss';
import { clamp } from './clamp';
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
	const [searchParams] = useSearchParams();
	const { videoFolders, itemsPerPage } = useSettings();
	const { page } = useParams();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const videos = useVideos();
	const setVideos = useVideosSet();
	const search = useSearch();
	const [query, setQuery] = useState(searchParams.get('q') || '');
	const [sort, setSort] = useState<'sortAsc' | 'sortDesc' | 'sortNone'>(
		'sortNone'
	);
	const navigate = useNavigate();

	const numPage = useMemo(() => {
		const num = parseInt(page || '0', 10);
		if (Number.isNaN(num)) return 0;
		return num;
	}, [page]);
	const lastPage = usePrevious(numPage) || -1;

	const filteredVideos = useMemo(
		() => (query ? search(query) : videos),
		[query, search, videos]
	);
	const sorted = useMemo(() => {
		if (sort === 'sortNone') return filteredVideos;
		const copy = filteredVideos.slice();
		copy.sort(({ name: a = '' }, { name: b = '' }) =>
			a?.localeCompare(b, undefined, { sensitivity: 'base' })
		);
		if (sort === 'sortDesc') copy.reverse();
		return copy;
	}, [filteredVideos, sort]);

	const loadVideos = useCallback(async () => {
		try {
			setLoading(true);
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
			setVideos(files);
		} catch (err) {
			console.error(err);
			setError(getErrorMessage(err));
		} finally {
			setLoading(false);
		}
	}, [setVideos, videoFolders]);

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

	const { totalPages, startIndex, endIndex, setPage } = usePagination({
		totalItems: sorted.length,
		initialPage: numPage,
		initialPageSize: itemsPerPage || 1,
	});

	const goto = useCallback(
		(newPage: number) => {
			if (Number.isNaN(newPage)) return;
			navigate(`/videos/${clamp(0, newPage, totalPages - 1)}?q=${query}`);
		},
		[navigate, query, totalPages]
	);

	const onSearch = useCallback<ChangeEventHandler<HTMLInputElement>>(
		(event) => {
			setQuery(event.currentTarget.value);
			navigate(`/videos/0?q=${event.currentTarget.value}`, { replace: true });
		},
		[navigate]
	);

	// load videos on first view if there are none
	useEffect(() => {
		if (videos.length) return;
		loadVideos();
	}, [videos, loadVideos]);
	useLayoutEffect(() => {
		setPage(numPage);
	}, [numPage, setPage]);

	// scroll down if going back 1 page,
	// otherwise scroll up if changing page
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
					{videos.map((i) => (
						// datalist doesn't need label
						// eslint-disable-next-line jsx-a11y/control-has-associated-label
						<option key={i.path} value={i.name} />
					))}
				</datalist>
				<button type="button" onClick={loadVideos} title="Refresh videos">
					<Icon icon="refresh" />
				</button>
				<div className={styles.search}>
					<Icon icon="search" />
					<input
						type="text"
						list="list-videos"
						placeholder="Search..."
						value={query}
						onChange={onSearch}
					/>
				</div>

				<span className={styles.count}>
					{sorted.length
						.toString(10)
						.padStart(videos.length.toString(10).length, '0')}{' '}
					/&nbsp;{videos.length}
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
				count={sorted.length}
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
