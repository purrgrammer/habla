import { type NostrEvent, kinds } from "nostr-tools";
import {
  createEventLoader,
  createAddressLoader,
} from "applesauce-loaders/loaders";
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
import { AGGREGATOR_RELAYS, INDEX_RELAYS } from "~/const";
import pool from "~/services/relay-pool";
import eventStore from "~/services/event-store";

export const addressLoader = createAddressLoader(pool, {
  eventStore,
  extraRelays: AGGREGATOR_RELAYS,
});

export const eventLoader = createEventLoader(pool, {
  eventStore,
  extraRelays: AGGREGATOR_RELAYS,
});

export const profileLoader = createAddressLoader(pool, {
  eventStore,
  bufferTime: 200,
  lookupRelays: INDEX_RELAYS,
});

export const blossomServerListLoader = createAddressLoader(pool, {
  eventStore,
  bufferTime: 200,
});

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
