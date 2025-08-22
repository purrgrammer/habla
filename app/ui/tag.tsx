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
  return tags.length > 0 ? (
    <div
      className={cn(
        `flex flex-row items-center gap-1 py-2
        overflow-auto overflox-x-scroll
        no-scrollbar
        `,
        className,
      )}
    >
      {tags.map((t) => (
        <Tag key={t} tag={t} />
      ))}
    </div>
  ) : null;
}
