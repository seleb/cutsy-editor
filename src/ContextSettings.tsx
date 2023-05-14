import { ask } from '@tauri-apps/api/dialog';
import { Dispatch, PropsWithChildren, createContext, useCallback, useContext, useEffect, useReducer } from 'react';

type State = {
	theme: 'auto' | 'dark' | 'light';
	font: 'Bitch' | 'Boring';
	openAfterSave: 'true' | 'false';
	videoFolders: string[];
	saveAudio: 'always' | 'never' | 'editor';
};

const initial: State = {
	theme: 'auto',
	font: 'Bitch',
	openAfterSave: 'true',
	videoFolders: [],
	saveAudio: 'always',
};

export const availableSettings = Object.keys(initial) as (keyof State)[];

type Action<T extends keyof State> =
	| {
			type: 'set';
			key: T;
			value: State[T];
	  }
	| {
			type: 'reset';
	  };

function reducer(state: State, action: Action<keyof State>) {
	switch (action.type) {
		case 'reset':
			return { ...initial };
		case 'set':
			return {
				...state,
				[action.key]: action.value,
			};
		default:
			throw new Error('Unsupported action');
	}
}

const contextState = createContext<State>(initial);
const contextDispatch = createContext<Dispatch<Action<keyof State>>>(() => {});

let persistedState: State;
try {
	persistedState = JSON.parse(localStorage.getItem('state') || '{}') as State;
	persistedState = {
		...initial,
		...persistedState,
	};
} catch (err) {
	console.error("failed to load persisted settings", err);
	persistedState = initial;
}

export function ContextSettings({ children }: PropsWithChildren<unknown>) {
	const [state, dispatch] = useReducer(reducer, persistedState);

	useEffect(() => {
		localStorage.setItem('state', JSON.stringify(state));
	}, [state])

	useEffect(() => {
		document.documentElement.dataset.font = state.font;
	}, [state.font]);
	useEffect(() => {
		document.documentElement.dataset.theme = state.theme;
	}, [state.theme]);

	return (
		<contextState.Provider value={state}>
			<contextDispatch.Provider value={dispatch}>{children}</contextDispatch.Provider>
		</contextState.Provider>
	);
}

export function useSettings() {
	return useContext(contextState);
}

export function useSettingsSet() {
	const dispatch = useContext(contextDispatch);
	return useCallback(<T extends keyof State>(key: T, value: State[T]) => dispatch({ type: 'set', key, value }), [dispatch]);
}

export function useSettingsReset() {
	const dispatch = useContext(contextDispatch);
	return useCallback(async () => {
		if (!await ask('Are you sure? This action cannot be undone.', { type: 'warning' })) return;
		dispatch({ type: 'reset' });
	}, [dispatch]);
}
