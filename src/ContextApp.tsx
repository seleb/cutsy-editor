import { FileEntry } from '@tauri-apps/api/fs';
import {
	AllSubstringsIndexStrategy,
	Search,
	UnorderedSearchIndex,
} from 'js-search';
import {
	Dispatch,
	PropsWithChildren,
	createContext,
	useCallback,
	useContext,
	useEffect,
	useReducer,
	useState,
} from 'react';

type Command =
	| {
			command: 'vid_to_img';
			input: string;
			output: string;
			/** time in microseconds */
			time: number;
	  }
	| {
			command: 'vid_to_clip';
			input: string;
			output: string;
			/** time in microseconds */
			start: number;
			/** time in microseconds */
			duration: number;
			audio: boolean;
	  };

export type VideoType = FileEntry & { mtime: number };

type State = {
	/** last known video state */
	video: {
		path: string;
		clipStart: number;
		clipEnd: number;
	};
	queue: Command[];
	videos: VideoType[];
};

const initial: State = {
	video: {
		path: '',
		clipStart: 0,
		clipEnd: 1,
	},
	queue: [],
	videos: [],
};

type Action =
	| {
			type: 'video';
			video?: State['video'];
	  }
	| {
			type: 'videos';
			videos: State['videos'];
	  }
	| {
			type: 'queue-push';
			command: Command;
	  }
	| {
			type: 'queue-shift';
	  };

function reducer(state: State, action: Action) {
	switch (action.type) {
		case 'video':
			return { ...state, video: { ...initial.video, ...action.video } };
		case 'videos':
			return { ...state, videos: action.videos };
		case 'queue-push':
			return {
				...state,
				queue: state.queue.concat(action.command),
			};
		case 'queue-shift':
			return {
				...state,
				queue: state.queue.slice(1),
			};
		default:
			throw new Error('Unsupported action');
	}
}

const contextState = createContext<State>(initial);
const contextDispatch = createContext<Dispatch<Action>>(() => {});
const contextSearch = createContext<Search | null>(null);

export function ContextApp({ children }: PropsWithChildren<unknown>) {
	const [state, dispatch] = useReducer(reducer, initial);

	const [search, setSearch] = useState<Search | null>(null);

	useEffect(() => {
		const s = new Search('path');
		s.searchIndex = new UnorderedSearchIndex();
		s.indexStrategy = new AllSubstringsIndexStrategy();
		s.addIndex('name');
		s.addIndex('path');
		s.addDocuments(state.videos);
		setSearch(s);
	}, [state.videos]);

	return (
		<contextState.Provider value={state}>
			<contextDispatch.Provider value={dispatch}>
				<contextSearch.Provider value={search}>
					{children}
				</contextSearch.Provider>
			</contextDispatch.Provider>
		</contextState.Provider>
	);
}

export function useQueue() {
	return useContext(contextState).queue;
}

export function useVideo() {
	return useContext(contextState).video;
}

export function useVideos() {
	return useContext(contextState).videos;
}

export function useVideoSet() {
	const dispatch = useContext(contextDispatch);
	return useCallback(
		(video?: State['video']) => dispatch({ type: 'video', video }),
		[dispatch]
	);
}

export function useVideosSet() {
	const dispatch = useContext(contextDispatch);
	return useCallback(
		(videos: State['videos']) => dispatch({ type: 'videos', videos }),
		[dispatch]
	);
}

export function useQueuePush() {
	const dispatch = useContext(contextDispatch);
	return useCallback(
		(command: Command) => dispatch({ type: 'queue-push', command }),
		[dispatch]
	);
}

export function useQueueShift() {
	const dispatch = useContext(contextDispatch);
	return useCallback(() => dispatch({ type: 'queue-shift' }), [dispatch]);
}

export function useSearch() {
	const s = useContext(contextSearch);
	return useCallback(
		(query: string) => (s?.search(query) || []) as State['videos'],
		[s]
	);
}
