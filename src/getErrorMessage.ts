export function getErrorMessage(err: unknown) {
	if (err instanceof Error) return err.message;
	if (typeof err === 'string') return err;
	return 'Unknown error';
}
