import { ElementType, PropsWithChildren, ReactNode } from "react";
import { Spinner } from "./Spinner";

export function Loading({
	loading = false,
	error = false,
	count,
	msgLoading = '',
	msgError = 'Something went wrong',
	msgNone = 'Nothing found',
	Error = ({ children }) => <>{children}</>,
	Loading = Spinner,
	None = ({ children }) => <>{children}</>,
	children,
}: PropsWithChildren<{
	loading?: boolean;
	error?: boolean;
	count?: number;
	msgLoading?: ReactNode;
	msgError?: ReactNode;
	msgNone?: ReactNode;
	Error?: ElementType;
	Loading?: ElementType;
	None?: ElementType;
}>) {
	if (error) return <Error>{msgError}</Error>
	if (loading) return <Loading>{msgLoading}</Loading>
	if (count === 0) return <None>{msgNone}</None>
	return <>{children}</>;
}
