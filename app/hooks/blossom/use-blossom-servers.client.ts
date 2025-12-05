import { useMemo } from "react";
import { useActiveAccount } from "applesauce-react/hooks";
import { useTimeline } from "~/hooks/nostr.client";

const DEFAULT_BLOSSOM_SERVER = "https://blossom.band";
const BLOSSOM_SERVER_LIST_KIND = 10063;

/**
 * Hook to fetch the user's Blossom server list from kind:10063 events
 * Returns array of server URLs, with default server if none configured
 */
export function useBlossomServers() {
  const account = useActiveAccount();
  const pubkey = account?.pubkey;

  // Fetch kind:10063 events for the logged-in user
  const { timeline } = useTimeline(
    pubkey ? `${pubkey}-blossom-servers` : "no-servers",
    {
      kinds: [BLOSSOM_SERVER_LIST_KIND],
      authors: pubkey ? [pubkey] : [],
    },
    [], // Empty relays means use default relays
  );

  const servers = useMemo(() => {
    if (!timeline || timeline.length === 0) {
      // Return default server if no configuration found
      return [DEFAULT_BLOSSOM_SERVER];
    }

    // Get the most recent event (timeline is already sorted by created_at desc)
    const latestEvent = timeline[0];

    // Extract server tags: ["server", "https://..."]
    const serverTags = latestEvent.tags
      .filter((tag) => tag[0] === "server" && tag[1])
      .map((tag) => tag[1]);

    // Return servers or default if none found
    return serverTags.length > 0 ? serverTags : [DEFAULT_BLOSSOM_SERVER];
  }, [timeline]);

  return {
    servers,
    hasCustomServers: timeline && timeline.length > 0,
    isLoading: !timeline,
  };
}
