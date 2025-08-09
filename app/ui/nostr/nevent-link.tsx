import { useMemo } from "react";
import { Link } from "react-router";
import { nip19 } from "nostr-tools";
import { type EventPointer } from "nostr-tools/nip19";

export default function NEventLink(props: EventPointer) {
  const bech32 = useMemo(() => nip19.neventEncode(props), [props]);
  return (
    <Link
      className="hover:underline hover:decoration-dotted break-all"
      to={`/a/${bech32}`}
    >
      {bech32}
    </Link>
  );
}
