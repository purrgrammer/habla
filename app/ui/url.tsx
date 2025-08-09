import { Link } from "react-router";
import { cn } from "~/lib/utils";
import { prettify } from "~/lib/url";

export default function Url({
  href,
  text,
  className,
}: {
  href: string;
  text?: string;
  className?: string;
}) {
  return (
    <Link
      target="_blank"
      to={`${href}${text ? "#:~:text=" + text : ""}`}
      className={cn(
        "hover:underline hover:decoration-dotted text-primary",
        className,
      )}
    >
      {prettify(href)}
    </Link>
  );
}
