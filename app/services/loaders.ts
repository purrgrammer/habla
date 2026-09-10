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

export const profileLoader = createAddressLoader(pool, {
  eventStore,
  bufferTime: 200,
  lookupRelays: INDEX_RELAYS,
});

export const blossomServerListLoader = createAddressLoader(pool, {
  eventStore,
  bufferTime: 200,
});
