import { ElementType, PropsWithChildren, ReactNode } from "react";
import { Spinner } from "./Spinner";

export function Loading({
	loading = false,
	error = false,
	count,
	msgLoading = '',
	msgError = 'Something went wrong',
	msgNone = 'Nothing found',
	Error = ({ children: c }) => <>{c}</>,
	Loading: LoadingTag = Spinner,
	None = ({ children: c }) => <>{c}</>,
	children,
	...props
}: PropsWithChildren<{
	className?: string;
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
	if (error) return <Error {...props}>{msgError}</Error>
	if (loading) return <LoadingTag {...props}>{msgLoading}</LoadingTag>
	if (count === 0) return <None {...props}>{msgNone}</None>
	return <>{children}</>;
}
