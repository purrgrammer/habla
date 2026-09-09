import type { NostrEvent } from "nostr-tools";
import type {
  ProfilePointer,
  EventPointer,
  AddressPointer,
} from "nostr-tools/nip19";
import type { ProfileContent } from "applesauce-core/helpers";
import type { Pubkey, Relay } from "~/types";

export interface DataStore {
  fetchRelays(pubkey: Pubkey): Promise<Relay[]>;
  fetchProfile(pointer: ProfilePointer): Promise<ProfileContent | undefined>;
  fetchEvent(pointer: EventPointer): Promise<NostrEvent | undefined>;
  fetchAddress(pointer: AddressPointer): Promise<NostrEvent | undefined>;
}
