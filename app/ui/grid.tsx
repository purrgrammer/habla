import { type ReactNode } from "react";
import { cn } from "~/lib/utils";

export default function Grid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-4",
        className,
      )}
    >
      {children}
    </div>
  );
}
