import type { Route } from "./+types/relay";
import RelayFeed from "~/ui/nostr/relay-feed";

export default function Relay({ params }: Route.ComponentProps) {
  const { relay } = params;
  return relay ? (
    <>
      <RelayFeed relay={relay} />
    </>
  ) : null;
}
