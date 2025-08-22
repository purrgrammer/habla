import { cn } from "~/lib/utils";

export default function Image({
  src,
  className,
}: {
  src: string;
  className?: string;
}) {
  return (
    <img
      className={cn("aspect-image rounded-sm mx-auto my-2", className)}
      src={src}
    />
  );
}
