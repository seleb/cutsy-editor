import { ElementType, PropsWithChildren, ReactNode } from "react";
import { Spinner } from "./Spinner";

export function Loading({
	loading = false,
	error = false,
	msgLoading = '',
	msgError = 'Something went wrong',
	Error = ({ children }) => <>{children}</>,
	Loading = Spinner,
	children,
}: PropsWithChildren<{
	loading?: boolean;
	error?: boolean;
	msgLoading?: ReactNode;
	msgError?: ReactNode;
	Error?: ElementType;
	Loading?: ElementType;
}>) {
	if (error) return <Error>{msgError}</Error>
	if (loading) return <Loading>{msgLoading}</Loading>
	return <>{children}</>;
}
