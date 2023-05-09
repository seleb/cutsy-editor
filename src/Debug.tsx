import { PropsWithChildren } from 'react';

export const debug = process.env.NODE_ENV === 'development';

export function Debug({ children }: PropsWithChildren<{}>) {
	return debug ? <>{children}</> : null;
}
