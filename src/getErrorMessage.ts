export function getErrorMessage(err: unknown) {
	if (err instanceof Error) return err.message;
	else if (typeof err === 'string') return err;
	else return 'Unknown error';
}
