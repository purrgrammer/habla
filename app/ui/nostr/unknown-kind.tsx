import type { NostrEvent } from "nostr-tools";

export default function UnknownKind({ event }: { event: NostrEvent }) {
  return (
    <div className="prose">
      <pre className="text-xs">{JSON.stringify(event, null, 2)}</pre>
    </div>
  );
}
