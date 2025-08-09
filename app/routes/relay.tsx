import ClientOnly from "~/ui/client-only";
import type { Route } from "./+types/relay";
import RelayFeed from "~/ui/nostr/relay-feed.client";

export default function Relay({ params }: Route.ComponentProps) {
  const { relay } = params;
  return relay ? (
    <>
      <ClientOnly>{() => <RelayFeed relay={relay} />}</ClientOnly>
    </>
  ) : null;
}
