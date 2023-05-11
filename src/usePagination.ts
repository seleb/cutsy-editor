import { Reducer, useCallback, useEffect, useReducer, useRef } from 'react';

type State<T> = {
	items: readonly T[];
	loading: boolean;
	hasMore: boolean;
	error: boolean;
};

type Action<T> =
	| {
			type: 'reset';
	  }
	| {
			type: 'get';
	  }
	| {
			type: 'got';
			hasMore: boolean;
			items: T[];
	  }
	| {
			type: 'error';
	  };

function reducer<T>(state: State<T>, action: Action<T>) {
	switch (action.type) {
		case 'reset':
			return { ...initialState as typeof state };
		case 'get':
			return { ...state, loading: true, error: false };
		case 'got':
			return {
				...state,
				loading: false,
				hasMore: action.hasMore,
				items: state.items.concat(action.items),
			};
		case 'error':
			return {
				...state,
				loading: false,
				hasMore: false,
				error: true,
			};
		default:
			throw new Error('Unsupported type');
	}
}
const initialState: State<unknown> = {
	items: [],
	loading: true,
	hasMore: true,
	error: false,
};

/**
 * @param fetchMore
 * async function which accepts the results of the last fetch and returns the next page
 * @param numToFetch
 * how many items to fetch, only used to determine when the end has been reached.
 * if not provided, end will be reached when a fetch returns zero items
 */
export default function usePagination<T>(fetchMore: (last: readonly T[]) => Promise<T[]>, numToFetch = 1) {
	const [state, dispatch] = useReducer<Reducer<State<T>, Action<T>>>(reducer, initialState as State<T>);
	const lastRef = useRef(state.items);
	const loadMore = useCallback(async () => {
		const last = lastRef.current;
		dispatch({ type: 'get' });
		try {
			const items = await fetchMore(last);
			lastRef.current = items;
			dispatch({ type: 'got', hasMore: items.length >= numToFetch, items });
			return items;
		} catch (err) {
			dispatch({ type: 'error' });
			console.error('Pagination error', err);
			return undefined;
		}
	}, [fetchMore, numToFetch]);
	// initial load; we only want it to run once
	useEffect(() => {
    dispatch({ type: 'reset' });
		loadMore();
	}, [loadMore]);
	return {
		...state,
		loadMore,
	};
}
