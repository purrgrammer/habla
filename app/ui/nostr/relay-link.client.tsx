import { Server } from "lucide-react";
import { Link } from "react-router";
import { cn } from "~/lib/utils";
import { useRelayInfo } from "~/nostr/queries";

export function RelayName({
  relay,
  className,
}: {
  relay: string;
  className?: string;
}) {
  const { data: info } = useRelayInfo(relay);
  const host = relay
    .replace(/^wss?:\/\//, "")
    .replace(/\/$/, "")
    .replace(/^relay\./, "");
  return (
    <span className={cn("font-sans text-md line-clamp-1", className)}>
      {info?.name || host}
    </span>
  );
}

export function RelayIcon({
  relay,
  className,
}: {
  relay: string;
  className?: string;
}) {
  const { data: info } = useRelayInfo(relay);
  const favicon = info?.icon;
  return favicon ? (
    <img
      src={favicon}
      className={cn("rounded-full size-5 flex-shrink-0", className)}
    />
  ) : (
    <Server
      className={cn("text-muted-foreground size-5 flex-shrink-0", className)}
    />
  );
}

export default function RelayLink({ relay }: { relay: string }) {
  const { data: info } = useRelayInfo(relay);
  const host = relay
    .replace(/^wss?:\/\//, "")
    .replace(/\/$/, "")
    .replace(/^relay\./, "");
  const favicon = info?.icon;
  const link = `/relay/${encodeURIComponent(relay)}`;
  return (
    <Link
      className="flex flex-row items-center gap-2 text-primary 
      break-all
      hover:underline hover:decoration-dotted"
      to={link}
    >
      {favicon ? (
        <img src={favicon} className="rounded-full size-5 flex-shrink-0" />
      ) : (
        <Server className="size-5 text-muted-foreground flex-shrink-0" />
      )}
      <span className="font-sans text-md line-clamp-1">{host}</span>
    </Link>
  );
}
