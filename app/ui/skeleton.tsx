import { cn } from "~/lib/utils";

export function Card({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-accent animate-pulse w-full h-32 rounded-sm",
        className,
      )}
    ></div>
  );
}

export function Avatar({ className }: { className?: string }) {
  return (
    <div
      className={cn("bg-accent animate-pulse size-9 rounded-full", className)}
    ></div>
  );
}
