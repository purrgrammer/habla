import { useMemo } from "react";
import { Link } from "react-router";
import { nip19 } from "nostr-tools";
import { cn } from "~/lib/utils";
import { type AddressPointer } from "nostr-tools/nip19";

export default function NAddrLink(
  props: AddressPointer & { className?: string },
) {
  const bech32 = useMemo(() => nip19.naddrEncode(props), [props]);
  return (
    <Link
      className={cn(
        "hover:underline hover:decoration-dotted text-primary break-all",
        props.className,
      )}
      to={`/a/${bech32}`}
    >
      {bech32}
    </Link>
  );
}
