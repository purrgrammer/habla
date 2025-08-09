import { cn } from "~/lib/utils";

export default function Video({
  src,
  className,
}: {
  src: string;
  className?: string;
}) {
  return (
    <video
      controls
      className={cn("aspect-video my-2 rounded-sm", className)}
      src={src}
    />
  );
}
