import {
	Dispatch,
	PropsWithChildren,
	createContext,
	useCallback,
	useContext,
	useReducer,
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

type State = {
	/** last known video state */
	video: {
		path: string;
		clipStart: number;
		clipEnd: number;
	};
	queue: Command[];
};

const initial: State = {
	video: {
		path: '',
		clipStart: 0,
		clipEnd: 1,
	},
	queue: [],
};

type Action =
	| {
			type: 'video';
			video?: State['video'];
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

export function ContextApp({ children }: PropsWithChildren<unknown>) {
	const [state, dispatch] = useReducer(reducer, initial);

	return (
		<contextState.Provider value={state}>
			<contextDispatch.Provider value={dispatch}>
				{children}
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

export function useVideoSet() {
	const dispatch = useContext(contextDispatch);
	return useCallback(
		(video?: State['video']) => dispatch({ type: 'video', video }),
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
