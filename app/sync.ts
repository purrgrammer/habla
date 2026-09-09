import WebSocket from "ws";
(global as any).WebSocket = WebSocket;

import {
  default as store,
  REDIS_ENABLED,
  syncRelays,
  syncProfile,
  syncArticles,
} from "./services/data.server";
import { type Nip05Pointer } from "~/services/types";

async function syncUser(pointer: Nip05Pointer) {
  const { pubkey, nip05, relays } = pointer;
  console.log(`[sync] user ${nip05} started`);
  await Promise.allSettled([
    syncRelays(pubkey, nip05),
    syncProfile(pubkey, relays),
    syncArticles(pointer),
  ]);
  console.log(`[sync] user ${nip05} complete`);
}

async function syncUsers() {
  const users = await store.getMembers();
  console.log(`[sync] syncing ${users.length} members`);
  const responses = await Promise.allSettled(users.map(syncUser));
  const successes = responses.filter(({ status }) => status === "fulfilled");
  const errors = responses.filter(({ status }) => status === "rejected");
  console.log(
    `[sync] synced ${successes.length} members, ${errors.length} failed syncs`,
  );
}

await (async function main() {
  try {
    if (!REDIS_ENABLED) {
      console.error(
        "[sync] REDIS_URL is not set. Syncing only makes sense with a Redis cache to write to.",
      );
      process.exit(1);
    }
    await syncUsers();
  } catch (err) {
    console.error(err);
  }
})()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
