import { useCallback, useMemo } from 'react';
import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router';
import { Button } from './Button';
import { H } from './H';
import styles from './ViewError.module.scss';

function ContextualDetails() {
	const error = useRouteError();
	if (!isRouteErrorResponse(error))
		return error instanceof Error ? (
			<p>
				<strong>{error.message}</strong>
			</p>
		) : null;
	if (error.status === 404)
		return (
			<div>
				<strong>
					{error.status} - {error.statusText}
				</strong>
				<p>This page doesn't exist!</p>
			</div>
		);

	if (error.status >= 500)
		return (
			<div>
				<strong>
					{error.status} - {error.statusText}
				</strong>
				<p>There was an API issue!</p>
			</div>
		);

	return (
		<div>
			<strong>
				{error.status} - {error.statusText}
			</strong>
			<p>There was a routing issue!</p>
		</div>
	);
}

export function ViewError() {
	const navigate = useNavigate();
	const goBack = useCallback(() => navigate(-1), []);
	const refresh = useCallback(() => navigate(0), []);
	const error = useRouteError();
	const errorDetails = useMemo(() => {
		try {
			return JSON.stringify(error, undefined, '\t');
		} catch {
			return error instanceof Error ? error.message : 'Unknown error';
		}
	}, [error]);
	return (
		<div className={styles.container}>
			<H>Oops! Something went wrong...</H>
			<ContextualDetails />
			<div className={styles.buttons}>
				<Button onClick={refresh}>Try reloading page</Button>
				<Button onClick={goBack}>Try going back a page</Button>
			</div>
			<details className={styles.error}>
				<summary>More details</summary>
				<pre>{errorDetails}</pre>
			</details>
		</div>
	);
}
