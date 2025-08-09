import { type EventPointer } from "nostr-tools/nip19";
import ClientNEvent from "~/ui/nostr/nevent.client";
import ClientOnly from "~/ui/client-only";
import { Card as SkeletonCard } from "~/ui/skeleton";

export default function NEvent(props: EventPointer) {
  return (
    <ClientOnly fallback={<SkeletonCard />}>
      {() => <ClientNEvent {...props} />}
    </ClientOnly>
  );
}
