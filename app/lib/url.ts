import type { NostrEvent } from "nostr-tools";
import { normalizeURL } from "nostr-tools/utils";
import { isSafeRelayURL } from "applesauce-core/helpers";

export function prettify(url: string) {
  const clean = url
    .trim()
    .replace(/^https?\:\/\//, "")
    .replace(/\/$/, "");
  try {
    return clean ? decodeURIComponent(clean) : url;
  } catch (err) {
    return clean || url;
  }
}

export function getRelayURLs(event: NostrEvent) {
  const relayUrls = event.tags
    .filter((t) => t[0] === "r" && t[1] && isSafeRelayURL(t[1]))
    .map((t) => normalizeURL(t[1]));
  return relayUrls;
}
