import type { Observable } from "rxjs";
import type { NostrEvent } from "nostr-tools";
import { kinds } from "nostr-tools";
import type {
  ProfilePointer,
  EventPointer,
  AddressPointer,
} from "nostr-tools/nip19";
import type { ProfileContent } from "applesauce-core/helpers";
import { profileLoader, eventLoader, addressLoader } from "./loaders";
import { getProfileContent } from "applesauce-core/helpers";
import { type DataStore } from "./types";
import type { Pubkey, Relay } from "~/types";
import { getRelayURLs } from "~/lib/url";
import { firstOrNothing as withDeadline } from "~/lib/first-or-nothing";

/**
 * Client fetches get a longer leash than SSR does — nobody is waiting on a
 * TTFB here — but they still have to end, or a route sits on its skeleton
 * forever.
 */
const CLIENT_TIMEOUT = Number(import.meta.env?.VITE_CLIENT_TIMEOUT ?? 10_000);

/** First event from a loader, or `undefined` — never hangs, never throws. */
function firstOrNothing(source: Observable<NostrEvent>) {
  return withDeadline(source, CLIENT_TIMEOUT);
}

function fetchProfile(
  pointer: ProfilePointer,
): Promise<ProfileContent | undefined> {
  return firstOrNothing(
    profileLoader({ kind: kinds.Metadata, ...pointer }),
  ).then((event) => (event ? getProfileContent(event) : undefined));
}

function fetchRelays(pubkey: Pubkey): Promise<Relay[]> {
  return firstOrNothing(profileLoader({ kind: kinds.RelayList, pubkey })).then(
    (event) => (event ? getRelayURLs(event) : []),
  );
}

function fetchEvent(pointer: EventPointer): Promise<NostrEvent | undefined> {
  return firstOrNothing(eventLoader(pointer));
}

function fetchAddress(
  pointer: AddressPointer,
): Promise<NostrEvent | undefined> {
  return firstOrNothing(addressLoader(pointer));
}

const store: DataStore = {
  fetchRelays,
  fetchProfile,
  fetchEvent,
  fetchAddress,
};

export default store;
