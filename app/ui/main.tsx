import { type ReactNode } from "react";
import { cn } from "~/lib/utils";

export default function Main({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <main
      className={cn(
        "flex flex-col items-center w-xs xsm:w-sm sm:w-xl lg:w-2xl",
        className,
      )}
    >
      {children}
    </main>
  );
}
