import { cn } from "~/lib/utils";

export default function Blockquote({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <blockquote
      className={cn(
        "font-sans italic text-lg border-l-4 border-muted pl-4 text-muted-foreground",
        className,
      )}
    >
      {text}
    </blockquote>
  );
}
