import { useMemo, type ReactNode } from "react";
import { Link } from "react-router";
import { nip19 } from "nostr-tools";
import { type EventPointer } from "nostr-tools/nip19";

interface NEventLinkProps extends EventPointer {
  className?: string;
  children?: ReactNode;
}

export default function NEventLink({
  children,
  className,
  ...props
}: NEventLinkProps) {
  const bech32 = useMemo(() => nip19.neventEncode(props), [props]);
  return (
    <Link className={className} to={`/e/${bech32}`}>
      {children || bech32}
    </Link>
  );
}
