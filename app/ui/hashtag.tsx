import { type ReactNode } from "react";
import { Link } from "react-router";
import { cn } from "~/lib/utils";

export function HashtagLink({
  hashtag,
  className,
  children,
}: {
  hashtag: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      to={`/t/${hashtag}`}
      className={cn(
        "text-primary hover:underline hover:decoration-dotted",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export default function Hashtags({
  name,
  hashtag,
}: {
  name: string;
  hashtag: string;
}) {
  return (
    <Link
      to={`/t/${hashtag}`}
      className="text-primary hover:underline hover:decoration-dotted"
    >
      #{name}
    </Link>
  );
}
