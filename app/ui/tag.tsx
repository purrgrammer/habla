//import { Link } from "react-router";
import { cn } from "~/lib/utils";
import { Badge } from "./badge";

export default function Tag({ tag }: { tag: string }) {
  return <Badge variant="tag">{tag}</Badge>;
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
