import { firstValueFrom, lastValueFrom, map, timeout, toArray } from "rxjs";
import { completeOnEose } from "applesauce-relay/operators";
import {
  getProfileContent,
  getTagValue,
  safeParse,
  type ProfileContent,
} from "applesauce-core/helpers";
import { kinds } from "nostr-tools";
import Redis from "ioredis";
import { type NostrEvent } from "nostr-tools";
import { getRelayURLs } from "../lib/url";
import type { Relay, Pubkey } from "~/types";
import pool from "./relay-pool";
import { AGGREGATOR_RELAYS, INDEX_RELAYS } from "../const";
import type {
  ProfilePointer,
  EventPointer,
  AddressPointer,
} from "nostr-tools/nip19";
import type { DataStore, Nip05Data, Nip05Pointer, User } from "./types";

const redisUrl = process.env.REDIS_URL;
const url = redisUrl || "localhost";
const redisOptions = {
  maxRetriesPerRequest: 1,
};
const host = url.replace(/:6379$/, "");

let redisInstance: Redis | undefined;
let isRedisOffline = false;

function getRedis(): Redis {
  if (!redisInstance) {
    console.log(`[redis] ${host}`);
    redisInstance = redisUrl
      ? new Redis(redisUrl, { ...redisOptions, lazyConnect: true })
      : new Redis(6379, host, { ...redisOptions, lazyConnect: true });

    // Add error listener to prevent unhandled 'error' events
    redisInstance.on("error", (err) => {
      if (!isRedisOffline) {
        console.warn("[redis] connection failed, entering offline mode:", err.message);
        isRedisOffline = true;
        // Try to reset offline mode after 1 minute
        setTimeout(() => {
          isRedisOffline = false;
          console.log("[redis] attempting to exit offline mode...");
        }, 60_000);
      }
    });

    console.log(`[redis] client initialized (lazy)`);
  }
  return redisInstance;
}

// Helper to check if redis is available before every call
function isAvailable() {
  return !isRedisOffline;
}

// Redis

// -- Relays

async function cacheNostrRelays(
  pubkey: string,
  relays: string[],
  username?: string,
): Promise<boolean> {
  if (!isAvailable()) return false;
  const key = `relays:${pubkey}`;
  const json = JSON.stringify(relays);
  console.log(`[cache] caching ${key} ${json}`);
  try {
    const writes = await getRedis().hset(key, pubkey, json);
    if (writes === 1) {
      console.log(`[cache] cache ${key} success`);
      return true;
    }
  } catch (e) {
    // Error handler already sets isRedisOffline
  }
  if (username) {
    await cacheNip05Relays(username, pubkey, relays);
  }
  return false;
}

async function getCachedRelays(pubkey: string): Promise<string[]> {
  if (!isAvailable()) return [];
  const key = `relays:${pubkey}`;
  try {
    const relaysJson = await getRedis().hget(key, pubkey);
    return relaysJson ? (safeParse(relaysJson) ?? []) : [];
  } catch (e) {
    return [];
  }
}

export async function fetchRelays(pubkey: string, username?: string) {
  const cached = await getCachedRelays(pubkey);
  if (cached && cached.length > 0) {
    console.log(`[fetch] cached relay list ${pubkey}`);
    return cached;
  }
  console.log(`[fetch] getting ${pubkey} relay list from nostr`);
  const relays = await fetchNostrRelays(pubkey, username);
  await cacheNostrRelays(pubkey, relays, username);
  return relays;
}

export async function syncRelays(pubkey: string, username?: string) {
  const startTime = Date.now();
  console.log(
    `[sync:relays] Starting sync for pubkey: ${pubkey}, username: ${username || "none"}`,
  );

  try {
    console.log(`[sync:relays] Fetching relay list from nostr for ${pubkey}`);
    const relays = await fetchNostrRelays(pubkey, username);
    console.log(
      `[sync:relays] Retrieved ${relays.length} relays: ${JSON.stringify(relays)}`,
    );

    console.log(`[sync:relays] Caching relays for ${pubkey}`);
    const cacheResult = await cacheNostrRelays(pubkey, relays, username);
    console.log(
      `[sync:relays] Cache operation ${cacheResult ? "successful" : "failed"} for ${pubkey}`,
    );

    const duration = Date.now() - startTime;
    console.log(`[sync:relays] Completed sync for ${pubkey} in ${duration}ms`);
    return relays;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(
      `[sync:relays] Error syncing relays for ${pubkey} after ${duration}ms:`,
      error,
    );
    throw error;
  }
}

// -- Profiles

function profileKey(pubkey: string): string {
  return `profile:${pubkey}`;
}

async function cacheNostrProfile(

  pubkey: string,

  profile: ProfileContent,

): Promise<string> {

  if (!isAvailable()) return "OK";

  try {

    return getRedis().set(

      profileKey(pubkey),

      JSON.stringify(profile),

      //"EX",

      //3600 // 1 hour ttl

    );

  } catch (e) {

    return "OK";

  }

}



async function getCachedProfile(

  pubkey: string,

): Promise<ProfileContent | null> {

  if (!isAvailable()) return null;

  try {

    const profilejson = await getRedis().get(profileKey(pubkey));

    return profilejson ? (safeParse(profilejson) ?? null) : null;

  } catch (e) {

    return null;

  }

}



// ... rest of the file stays similar but using isAvailable() check

export async function getUsername(username: string): Promise<string | null> {

  if (!isAvailable()) return null;

  try {

    return getRedis().hget(NIP05_NAMES, username);

  } catch (e) {

    return null;

  }

}



export async function saveUser({

  pubkey,

  username,

  relays,

}: {

  pubkey: Pubkey;

  username: string;

  relays: Relay[];

}) {

  if (!isAvailable()) return null;

  try {

    return getRedis()

      .multi()

      .hset(NIP05_NAMES, username, pubkey)

      .hset(NIP05_RELAYS, pubkey, JSON.stringify(relays))

      .exec();

  } catch (e) {

    return null;

  }

}



async function cacheNip05Relays(

  username: string,

  pubkey: string,

  relays: string[],

): Promise<boolean> {

  if (!isAvailable()) return false;

  const json = JSON.stringify(relays);

  console.log(`[cache] caching ${NIP05_RELAYS} ${username} ${json}`);

  try {

    const writes = await getRedis().hset(NIP05_RELAYS, pubkey, json);

    if (writes === 1) {

      console.log(`[cache] cache ${NIP05_RELAYS} success`);

      return true;

    }

  } catch (e) {}

  return false;

}



export async function getNip05(): Promise<Nip05Data> {

  if (!isAvailable()) return { names: {}, relays: {} };

  try {

    const response = await getRedis()

      .multi()

      .hgetall(NIP05_NAMES)

      .hgetall(NIP05_RELAYS)

      .exec();



    const names = (response?.[0]?.[1] as Record<string, string>) || {};

    const relaysRaw = (response?.[1]?.[1] as Record<string, string>) || {};



    const relays: Record<string, string[]> = {};

    for (const [pubkey, relaysJson] of Object.entries(relaysRaw)) {

      try {

        relays[pubkey] = safeParse(relaysJson) ?? [];

      } catch {

        relays[pubkey] = [];

      }

    }



        return { names, relays };



      } catch (e) {



        if (!isRedisOffline) {



          console.warn("[cache] failed to get nip05 data (Redis offline)");



        }



        return { names: {}, relays: {} };



      }



    }



export async function getMembers(): Promise<Nip05Pointer[]> {

  const { names, relays } = await getNip05();

  return Object.entries(names).map((kv) => {

    const [nip05, pubkey] = kv;

    return { nip05, pubkey, relays: relays[pubkey] || [] };

  });

}



// TODO: get members with full profile info: { username, pubkey, profile }



export async function getUsers(): Promise<User[]> {

  if (!isAvailable()) return [];

  try {

    const result = await getRedis().hgetall(NIP05_NAMES);

    const results = await Promise.allSettled(

      Object.entries(result).map(async (kv) => {

        const [username, pubkey] = kv;

        const profile = await fetchProfile({ pubkey });

        if (profile) return { username, pubkey, profile };

        throw new Error(

          `profile for ${username} with pubkey ${pubkey} not found`,

        );

      }),

    );

    return results.filter((r) => r.status === "fulfilled").map((r) => r.value);

  } catch (e) {

    return [];

  }

}



export async function getArticles(

  pointer: Nip05Pointer,

): Promise<NostrEvent[]> {

  if (!isAvailable()) return [];

  try {

    const { pubkey } = pointer;

    const identifiers = await getRedis().smembers(articlesKey(pubkey));

    if (identifiers.length === 0) return [];



    const results = await getRedis().mget(

      identifiers.map((identifier) =>

        addressKey({ pubkey, kind: kinds.LongFormArticle, identifier }),

      ),

    );



    return results

      .map((result) => (result ? safeParse(result) : null))

      .filter(Boolean);

  } catch (e) {

    return [];

  }

}



function articlesKey(pubkey: Pubkey): string {

  return `articles:${pubkey}`;

}



export async function fetchArticles({

  pubkey,

  nip05,

}: Nip05Pointer): Promise<NostrEvent[]> {

  const relays = await fetchRelays(pubkey, nip05);

  const articles = await fetchNostrArticles(

    pubkey,

    AGGREGATOR_RELAYS.concat(relays),

  );

  return articles;

}



async function getCachedAddress(

  address: AddressPointer,

): Promise<NostrEvent | undefined> {

  if (!isAvailable()) return undefined;

  try {

    const articleJson = await getRedis().get(addressKey(address));

    return articleJson ? safeParse(articleJson) : undefined;

  } catch (e) {

    return undefined;

  }

}



// -- Nostr



function eventKey(address: EventPointer) {

  return `event:${address.kind ?? kinds.ShortTextNote}:${address.id}`;

}



function addressKey(address: AddressPointer) {

  return `address:${address.kind}:${address.pubkey}:${address.identifier}`;

}



async function cacheAddress(

  address: AddressPointer,

  event: NostrEvent,

): Promise<string> {

  if (!isAvailable()) return "OK";

  try {

    return getRedis().set(addressKey(address), JSON.stringify(event));

  } catch (e) {

    return "OK";

  }

}



async function cacheEvent(

  address: EventPointer,

  event: NostrEvent,

): Promise<string> {

  if (!isAvailable()) return "OK";

  try {

    return getRedis().set(eventKey(address), JSON.stringify(event));

  } catch (e) {

    return "OK";

  }

}



async function getCachedEvent(

  address: EventPointer,

): Promise<NostrEvent | undefined> {

  if (!isAvailable()) return undefined;

  try {

    const json = await getRedis().get(eventKey(address));

    return json ? safeParse(json) : undefined;

  } catch (e) {

    return undefined;

  }

}



async function cacheArticle(

  address: AddressPointer,

  article: NostrEvent,

): Promise<void> {

  if (!isAvailable()) return;

  // TODO: only sadd to articles if

  try {

    const multi = getRedis().multi();

    multi.set(addressKey(address), JSON.stringify(article));

    multi.sadd(articlesKey(article.pubkey), address.identifier);

    await multi.exec();

  } catch (e) {}

}

export async function syncArticles({
  pubkey,
  nip05,
}: Nip05Pointer): Promise<NostrEvent[]> {
  const startTime = Date.now();
  console.log(
    `[sync:articles] Starting sync for pubkey: ${pubkey}, nip05: ${nip05}`,
  );

  try {
    console.log(`[sync:articles] Fetching relays for ${pubkey}`);
    const relays = await fetchRelays(pubkey, nip05);
    console.log(
      `[sync:articles] Retrieved ${relays.length} relays: ${JSON.stringify(relays)}`,
    );

    const combinedRelays = AGGREGATOR_RELAYS.concat(relays);
    console.log(
      `[sync:articles] Using ${combinedRelays.length} total relays (${AGGREGATOR_RELAYS.length} aggregator + ${relays.length} user): ${JSON.stringify(combinedRelays)}`,
    );

    console.log(`[sync:articles] Fetching articles from nostr for ${pubkey}`);
    const articles = await fetchNostrArticles(pubkey, combinedRelays);
    console.log(
      `[sync:articles] Retrieved ${articles.length} articles for ${pubkey}`,
    );

    if (articles.length > 0) {
      console.log(`[sync:articles] Article details:`);
      articles.forEach((article, index) => {
        const identifier = getTagValue(article, "d") || "";
        const title = getTagValue(article, "title") || "Untitled";
        console.log(
          `  [${index + 1}] ID: ${article.id}, Identifier: ${identifier}, Title: ${title}, Created: ${new Date(article.created_at * 1000).toISOString()}`,
        );
      });
    }

    console.log(`[sync:articles] Caching ${articles.length} articles`);
    const cacheResults = await Promise.allSettled(
      articles.map(async (article, index) => {
        const address = {
          kind: kinds.LongFormArticle,
          pubkey: article.pubkey,
          identifier: getTagValue(article, "d"),
        };
        console.log(
          `[sync:articles] Caching article ${index + 1}/${articles.length}: ${address.identifier}`,
        );
        if (address.identifier && address.identifier.trim().length > 0) {
          return cacheArticle(
            { ...address, identifier: address.identifier as string },
            article,
          );
        }
      }),
    );

    const successful = cacheResults.filter(
      (result) => result.status === "fulfilled",
    ).length;
    const failed = cacheResults.filter(
      (result) => result.status === "rejected",
    ).length;
    console.log(
      `[sync:articles] Cache results: ${successful} successful, ${failed} failed`,
    );

    if (failed > 0) {
      const failures = cacheResults
        .map((result, index) => ({ result, index }))
        .filter(({ result }) => result.status === "rejected")
        .map(
          ({ result, index }) =>
            `Article ${index + 1}: ${(result as PromiseRejectedResult).reason}`,
        );
      console.warn(`[sync:articles] Cache failures:`, failures);
    }

    const duration = Date.now() - startTime;
    console.log(
      `[sync:articles] Completed sync for ${pubkey} in ${duration}ms - ${articles.length} articles processed`,
    );
    return articles;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(
      `[sync:articles] Error syncing articles for ${pubkey} after ${duration}ms:`,
      error,
    );
    throw error;
  }
}

async function fetchNostrRelays(
  pubkey: string,
  username?: string,
): Promise<string[]> {
  return lastValueFrom(
    pool
      .req(INDEX_RELAYS, {
        kinds: [kinds.RelayList],
        authors: [pubkey],
        limit: 1,
      })
      .pipe(
        timeout(10_000),
        completeOnEose(),
        map((ev) => getRelayURLs(ev).filter((r) => !r.startsWith("ws://"))),
      ),
  );
}

async function fetchNostrProfile(
  pubkey: string,
  relays?: string[],
): Promise<ProfileContent | undefined> {
  return lastValueFrom(
    pool
      .req(INDEX_RELAYS.concat(relays ?? []), {
        kinds: [kinds.Metadata],
        authors: [pubkey],
        limit: 1,
      })
      .pipe(timeout(10_000), completeOnEose(), map(getProfileContent)),
  );
}

function fetchNostrAddress(pointer: AddressPointer): Promise<NostrEvent> {
  const { kind, pubkey, relays, identifier } = pointer;
  return firstValueFrom(
    pool
      .req(AGGREGATOR_RELAYS.concat(relays || []), {
        kinds: [kind],
        authors: [pubkey],
        "#d": [identifier],
      })
      .pipe(timeout(10_000), completeOnEose()),
  );
}

function fetchNostrEvent(pointer: EventPointer): Promise<NostrEvent> {
  const { kind, author, id, relays } = pointer;
  return lastValueFrom(
    pool
      .req(AGGREGATOR_RELAYS.concat(relays || []), {
        ids: [id],
        ...(kind ? { kinds: [kind] } : { kinds: [kinds.ShortTextNote] }),
        ...(author ? { authors: [author] } : {}),
      })
      .pipe(timeout(10_000), completeOnEose()),
  );
}

function fetchNostrArticles(pubkey: string, relays: string[]) {
  return lastValueFrom(
    pool
      .req(relays, {
        kinds: [kinds.LongFormArticle],
        authors: [pubkey],
      })
      .pipe(timeout(10_000), completeOnEose(), toArray()),
  );
}

// Loader API

export async function fetchProfile(
  pointer: ProfilePointer,
): Promise<ProfileContent | undefined> {
  const { pubkey } = pointer;
  const cached = await getCachedProfile(pubkey);
  if (cached) {
    console.log(
      `[fetch] cached profile ${pubkey}} : ${JSON.stringify(cached)}`,
    );
    return cached;
  }
  console.log(`[fetch] getting ${pubkey} profile from nostr`);
  const profile = await fetchNostrProfile(pubkey);
  if (profile) {
    await cacheNostrProfile(pubkey, profile);
    return profile;
  }
}

export async function fetchAddress(pointer: AddressPointer) {
  const cached = await getCachedAddress(pointer);
  if (cached) {
    return cached;
  }
  const nostr = await fetchNostrAddress(pointer);
  if (nostr) {
    await cacheAddress(pointer, nostr);
    return nostr;
  }
}

export async function fetchEvent(pointer: EventPointer) {
  const cached = await getCachedEvent(pointer);
  if (cached) {
    return cached;
  }
  const event = await fetchNostrEvent(pointer);
  if (event) {
    await cacheEvent(pointer, event);
    return event;
  }
}

const store: DataStore = {
  getMembers,
  getUsers,
  fetchRelays,
  fetchProfile,
  fetchAddress,
  fetchEvent,
};

export default store;
