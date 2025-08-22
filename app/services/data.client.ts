import { firstValueFrom } from "rxjs";
import type { NostrEvent } from "nostr-tools";
import { kinds } from "nostr-tools";
import type {
  ProfilePointer,
  EventPointer,
  AddressPointer,
} from "nostr-tools/nip19";
import type { ProfileContent } from "applesauce-core/helpers";
import { profileLoader, eventLoader, addressLoader } from "./loaders.client";
import { getProfileContent } from "applesauce-core/helpers";
import { type DataStore } from "./types";
import { getUsers, getMembers } from "~/lib/api.client";
import type { Pubkey, Relay } from "~/types";
import { getRelayURLs } from "~/lib/url";

function fetchProfile(
  pointer: ProfilePointer,
): Promise<ProfileContent | undefined> {
  return firstValueFrom(
    profileLoader({ kind: kinds.Metadata, ...pointer }),
  ).then(getProfileContent);
}

function fetchRelays(pubkey: Pubkey): Promise<Relay[]> {
  return firstValueFrom(profileLoader({ kind: kinds.RelayList, pubkey })).then(
    getRelayURLs,
  );
}

function fetchEvent(pointer: EventPointer): Promise<NostrEvent | undefined> {
  return firstValueFrom(eventLoader(pointer));
}

function fetchAddress(
  pointer: AddressPointer,
): Promise<NostrEvent | undefined> {
  return firstValueFrom(addressLoader(pointer));
}

const store: DataStore = {
  getMembers,
  getUsers,
  fetchRelays,
  fetchProfile,
  fetchEvent,
  fetchAddress,
};

export default store;
