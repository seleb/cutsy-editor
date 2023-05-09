import {
    ComponentProps,
    createContext,
    PropsWithChildren,
    useContext
} from "react";

export const contextHeading = createContext(1);

type Headings = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

function Heading({
  level,
  ...props
}: ComponentProps<Headings> & {
  level: number;
}) {
  const Tag = `h${Math.max(1, Math.min(level, 6))}` as Headings;
  return <Tag className="h" {...props} />;
}

export function HLevel({ children }: PropsWithChildren<unknown>) {
  const level = useContext(contextHeading);
  return (
    <contextHeading.Provider value={level + 1}>
      {children}
    </contextHeading.Provider>
  );
}

export function H({
  plus = 0,
  ...props
}: Omit<ComponentProps<typeof Heading>, "level"> & {
  plus?: number;
}) {
  const l = useContext(contextHeading) + plus;
  return <Heading level={l} {...props} />;
}
