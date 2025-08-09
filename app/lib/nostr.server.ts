import { kinds } from "nostr-tools";
import { addressLoader, profileLoader } from "~/services/loaders.client";

export async function fetchRelays(pubkey: string) {
  return addressLoader({
    kind: kinds.RelayList,
    pubkey,
  });
}

export async function fetchProfile(pubkey: string) {
  return profileLoader({
    kind: kinds.Metadata,
    pubkey,
  });
}

export async function fetchArticle(
  pubkey: string,
  identifier: string,
  relays: string[],
) {
  return addressLoader({
    kind: kinds.LongFormArticle,
    pubkey,
    identifier,
    relays,
  });
}

export function fetchArticles(pubkey: string, relays: string[]) {
  return addressLoader({
    kind: kinds.LongFormArticle,
    pubkey,
    relays,
  });
}
