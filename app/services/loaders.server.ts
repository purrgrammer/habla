import { type NostrEvent, kinds } from "nostr-tools";
import {
  type ProfilePointer,
  type EventPointer,
  type AddressPointer,
} from "nostr-tools/nip19";
import {
  createEventLoader,
  createAddressLoader,
} from "applesauce-loaders/loaders";
import { INDEX_RELAYS, AGGREGATOR_RELAYS } from "~/const";
import pool from "~/services/relay-pool";
import eventStore from "~/services/event-store";
import { firstValueFrom } from "applesauce-core";
import {
  getProfileContent,
  type ProfileContent,
} from "applesauce-core/helpers";

export const addressLoader = createAddressLoader(pool, {
  eventStore,
  bufferTime: 0,
  bufferSize: 0,
  lookupRelays: AGGREGATOR_RELAYS,
});

export const eventLoader = createEventLoader(pool, {
  eventStore,
  bufferTime: 0,
  bufferSize: 0,
  extraRelays: AGGREGATOR_RELAYS,
});

export const profileLoader = createAddressLoader(pool, {
  eventStore,
  bufferTime: 50,
  bufferSize: 100,
  lookupRelays: INDEX_RELAYS,
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
