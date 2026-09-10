import {
  createEventLoader,
  createAddressLoader,
} from "applesauce-loaders/loaders";
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

/**
 * Everything that says where a pubkey lives: kind 0, kind 10002 and the
 * kind-10063 Blossom server list.
 *
 * `createAddressLoader` walks its relay sets in order and stops at the first
 * that answers — cache, then the pointer's own relay hints, then `extraRelays`,
 * then `lookupRelays`. So the tiers here are a fallback chain, not one fan-out:
 * a caller's hints win, the indexers answer when there are none, and the
 * aggregators are asked only for a pubkey the indexers have never seen. That
 * last tier is why a missing profile is a slow lookup rather than a permanent
 * `undefined`.
 *
 * Routing these kinds by NIP-65 would be circular — you would need the relay
 * list to fetch the relay list — which is what the indexers are for.
 */
export const profileLoader = createAddressLoader(pool, {
  eventStore,
  bufferTime: 200,
  extraRelays: INDEX_RELAYS,
  lookupRelays: AGGREGATOR_RELAYS,
});
