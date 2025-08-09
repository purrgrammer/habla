import { cn } from "~/lib/utils";

export default function Image({
  src,
  className,
}: {
  src: string;
  className?: string;
}) {
  return <img className={cn("aspect-image rounded-sm", className)} src={src} />;
}
