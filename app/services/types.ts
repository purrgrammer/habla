import type { NostrEvent } from "nostr-tools";
import type {
  ProfilePointer,
  EventPointer,
  AddressPointer,
} from "nostr-tools/nip19";
import type { ProfileContent } from "applesauce-core/helpers";
import type { Pubkey, Relay } from "~/types";

export interface Nip05Pointer {
  pubkey: string;
  nip05: string;
  relays: string[];
}

export interface Nip05Data {
  names: Record<string, Pubkey>;
  relays: Record<Pubkey, Relay[]>;
}

export interface User {
  pubkey: string;
  username: string;
  profile: ProfileContent;
}

export interface DataStore {
  getUsers(): Promise<User[]>;
  getMembers(): Promise<Nip05Pointer[]>;

  fetchRelays(pubkey: Pubkey): Promise<Relay[]>;
  fetchProfile(pointer: ProfilePointer): Promise<ProfileContent | undefined>;
  fetchEvent(pointer: EventPointer): Promise<NostrEvent | undefined>;
  fetchAddress(pointer: AddressPointer): Promise<NostrEvent | undefined>;
}
