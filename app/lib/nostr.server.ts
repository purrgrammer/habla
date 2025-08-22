import { type NostrEvent, kinds } from "nostr-tools";
import { toArray, firstValueFrom, lastValueFrom } from "rxjs";
import type {
  ProfilePointer,
  EventPointer,
  AddressPointer,
} from "nostr-tools/nip19";
import {
  eventLoader,
  addressLoader,
  profileLoader,
} from "../services/loaders.server";
import { getRelayURLs } from "./url";
import { createTimelineLoader } from "applesauce-loaders/loaders";
import { getProfileContent } from "applesauce-core/helpers";
import { type ProfileContent } from "applesauce-core/helpers";
import pool from "../services/relay-pool";
import eventStore from "../services/event-store";

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
      limit: 200,
      eventStore,
    },
  )(since);
  return lastValueFrom(timelineLoader.pipe(toArray()));
}
