import type { NostrEvent } from "nostr-tools";
import { normalizeURL } from "nostr-tools/utils";
import { isSafeRelayURL } from "applesauce-core/helpers";

export function isImageLink(link: string) {
  const extensions = [".png", ".webp", ".jpg", ".jpeg", ".gif"];
  return extensions.some((ext) => link.endsWith(ext));
}

export function isVideoLink(link: string) {
  const extensions = [".webm", ".avi", ".mov", ".mp4"];
  return extensions.some((ext) => link.endsWith(ext));
}

export function isAudioLink(link: string) {
  const extensions = [".ogg", ".wav", ".mp3"];
  return extensions.some((ext) => link.endsWith(ext));
}

export function prettify(url: string) {
  return url
    ? decodeURIComponent(
        url
          .trim()
          .replace(/^https?\:\/\//, "")
          .replace(/\/$/, ""),
      )
    : url;
}

export function getRelayURLs(event: NostrEvent) {
  const relayUrls = event.tags
    .filter((t) => t[0] === "r" && t[1] && isSafeRelayURL(t[1]))
    .map((t) => normalizeURL(t[1]));
  console.log("RELAYURLS", relayUrls);
  return relayUrls;
}
