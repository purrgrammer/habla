import { type NostrEvent, kinds } from "nostr-tools";
import { toArray } from "rxjs";
import {
  type ProfilePointer,
  type EventPointer,
  type AddressPointer,
} from "nostr-tools/nip19";
import { firstValueFrom } from "rxjs";
import {
  type ProfileContent,
  getProfileContent,
} from "applesauce-core/helpers";
import { createTimelineLoader } from "applesauce-loaders/loaders";
import {
  addressLoader,
  eventLoader,
  profileLoader,
} from "~/services/loaders.server";
import eventStore from "./event-store";
import pool from "~/services/relay-pool";
import { getRelayURLs } from "~/lib/url";

export function fetchRelays(pubkey: string): Promise<string[]> {
  return firstValueFrom(profileLoader({ kind: kinds.RelayList, pubkey })).then(
    (event) => {
      if (event) {
        return getRelayURLs(event);
      }
      return [];
    },
  );
}

export function fetchProfile(
  pointer: ProfilePointer,
): Promise<ProfileContent | undefined> {
  return firstValueFrom(
    profileLoader({ kind: kinds.Metadata, ...pointer }),
  ).then(getProfileContent);
}

export function fetchEvent(
  pointer: EventPointer,
): Promise<NostrEvent | undefined> {
  return firstValueFrom(eventLoader(pointer));
}

export function fetchAddress(
  pointer: AddressPointer,
): Promise<NostrEvent | undefined> {
  return firstValueFrom(addressLoader(pointer));
}

export async function fetchArticles(
  pubkey: string,
  since?: number,
): Promise<NostrEvent[]> {
  const relays = await fetchRelays(pubkey);
  const timelineLoader = createTimelineLoader(
    pool,
    relays,
    {
      kinds: [kinds.LongFormArticle],
      authors: [pubkey],
    },
    {
      limit: 50,
      eventStore,
    },
  )(since);
  return firstValueFrom(timelineLoader.pipe(toArray()));
}
