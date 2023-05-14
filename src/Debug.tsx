import { PropsWithChildren } from 'react';

export const debug = process.env.NODE_ENV === 'development';

export function Debug({ children }: PropsWithChildren<unknown>) {
	return debug ? children as JSX.Element | null : null;
}
