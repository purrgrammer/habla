import { cn } from "~/lib/utils";
import { Badge } from "./badge";
import { HashtagLink } from "./hashtag";

// TODO: Color

// Size

const sizeClasses = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
  xl: "text-lg",
};

export default function Tag({
  tag,
  className,
  size = "md",
}: {
  tag: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  return (
    <HashtagLink className={className} hashtag={tag}>
      <Badge variant="tag" className={sizeClasses[size]}>
        {tag}
      </Badge>
    </HashtagLink>
  );
}

export function Tags({
  tags,
  className,
}: {
  tags: string[];
  className?: string;
}) {
  // Deduplicated here rather than at the call site: this component is what
  // assigns `key={t}`, so it is what has to guarantee the key is unique.
  // Repeated hashtags are ordinary in the wild — one published article carries
  // ["habla","nostr","nip-23","habla","nostr","nip-23"] — and rendering the
  // same badge twice was the visible half of the same bug.
  const unique = [...new Set(tags)];
  return unique.length > 0 ? (
    <div
      className={cn(
        `flex flex-row flex-wrap items-center gap-1 py-2
        overflow-auto overflox-x-scroll
        no-scrollbar
        `,
        className,
      )}
    >
      {unique.map((t) => (
        <Tag key={t} tag={t} />
      ))}
    </div>
  ) : null;
}
