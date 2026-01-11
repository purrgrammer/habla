import { useEffect } from "react";
import { useEventStore, useObservableMemo } from "applesauce-react/hooks";
import { map } from "rxjs";
import { useRelays } from "~/hooks/nostr";
import { blossomServerListLoader } from "~/services/loaders";
import { BLOSSOM_SERVER_LIST_KIND } from "~/const";

const DEFAULT_BLOSSOM_SERVER = "https://blossom.band";

/**
 * Hook to fetch the user's Blossom server list from kind:10063 events
 * Returns array of server URLs, with default server if none configured
 */
export function useBlossomServers(pubkey?: string) {
  const eventStore = useEventStore();
  const userRelays = useRelays(pubkey || "");

  // Get the replaceable event from the event store and extract servers
  const servers = useObservableMemo(() => {
    if (!pubkey) {
      return undefined;
    }

    return eventStore.replaceable(BLOSSOM_SERVER_LIST_KIND, pubkey).pipe(
      map((event) => {
        if (!event) {
          return [DEFAULT_BLOSSOM_SERVER];
        }

        // Extract server tags: ["server", "https://..."]
        const serverTags = event.tags
          .filter((tag) => tag[0] === "server" && tag[1])
          .map((tag) => tag[1].replace(/\/$/, "")); // Remove trailing slash

        // Deduplicate servers
        const uniqueServers = Array.from(new Set(serverTags));

        // Return servers or default if none found
        return uniqueServers.length > 0
          ? uniqueServers
          : [DEFAULT_BLOSSOM_SERVER];
      }),
    );
  }, [pubkey]);

  // Load the event from relays
  useEffect(() => {
    if (!pubkey) return;

    const subscription = blossomServerListLoader({
      kind: BLOSSOM_SERVER_LIST_KIND,
      pubkey,
      relays: userRelays,
    }).subscribe();

    return () => subscription.unsubscribe();
  }, [pubkey, userRelays]);

  return {
    servers: servers || [DEFAULT_BLOSSOM_SERVER],
    hasCustomServers:
      servers && servers.length > 0 && servers[0] !== DEFAULT_BLOSSOM_SERVER,
    isLoading: !servers && !!pubkey,
  };
}
