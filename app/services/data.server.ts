import {
  catchError,
  defaultIfEmpty,
  firstValueFrom,
  lastValueFrom,
  map,
  of,
  timeout,
  toArray,
} from "rxjs";
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
import { STATIC_NAMES } from "../members";

/**
 * Redis is an OPTIONAL cache/registry backend.
 *
 * - `REDIS_URL` set   -> Redis is used as a read-through cache and as the
 *                        NIP-05 member registry.
 * - `REDIS_URL` unset -> the app never opens a connection. Every cache read
 *                        misses, every cache write is a no-op, and the member
 *                        registry falls back to the static list in
 *                        `app/members.ts`.
 *
 * Nothing in the request path may block on Redis: connect/command timeouts are
 * short, and a failure flips the whole client into offline mode for a minute.
 */
/**
 * Per-relay-request deadline. Kept comfortably below `SSR_TIMEOUT` so a slow
 * relay resolves as "no data" rather than blowing the whole loader deadline.
 */
const NOSTR_TIMEOUT = Number(process.env.NOSTR_TIMEOUT ?? 2_500);

const redisUrl = process.env.REDIS_URL;
export const REDIS_ENABLED = Boolean(redisUrl);

const REDIS_CONNECT_TIMEOUT = Number(
  process.env.REDIS_CONNECT_TIMEOUT ?? 1_000,
);
const REDIS_COMMAND_TIMEOUT = Number(
  process.env.REDIS_COMMAND_TIMEOUT ?? 1_000,
);

const redisOptions = {
  maxRetriesPerRequest: 1,
  connectTimeout: REDIS_CONNECT_TIMEOUT,
  commandTimeout: REDIS_COMMAND_TIMEOUT,
  enableOfflineQueue: false,
  lazyConnect: true,
};

let redisInstance: Redis | undefined;
let isRedisOffline = false;

function getRedis(): Redis | undefined {
  if (!redisUrl) return undefined;
  if (!redisInstance) {
    redisInstance = new Redis(redisUrl, redisOptions);

    // Add error listener to prevent unhandled 'error' events
    redisInstance.on("error", (err) => {
      if (!isRedisOffline) {
        console.warn(
          "[redis] connection failed, entering offline mode:",
          err.message,
        );
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

/** Whether a Redis command may be attempted right now. */
function isAvailable() {
  return REDIS_ENABLED && !isRedisOffline;
}

// ============================================================================
// Generic Redis Cache Utilities
// ============================================================================

/**
 * Run a Redis command. Returns `fallback` when Redis is disabled, offline, or
 * the command throws — callers never have to care whether Redis exists.
 */
async function withRedis<T>(
  label: string,
  fn: (redis: Redis) => Promise<T>,
  fallback: T,
): Promise<T> {
  const redis = isAvailable() ? getRedis() : undefined;
  if (!redis) return fallback;
  try {
    return await fn(redis);
  } catch (e) {
    console.warn(`[cache] ${label} failed:`, e);
    return fallback;
  }
}

/**
 * Cache a value in Redis with the given key.
 * Returns true if the value was cached successfully, false otherwise.
 */
async function cacheValue<T>(key: string, value: T): Promise<boolean> {
  return withRedis(
    `set ${key}`,
    async (redis) => {
      await redis.set(key, JSON.stringify(value));
      return true;
    },
    false,
  );
}

/**
 * Get a cached value from Redis.
 * Returns the parsed value if found, null otherwise.
 */
async function getCachedValue<T>(key: string): Promise<T | null> {
  return withRedis<T | null>(
    `get ${key}`,
    async (redis) => {
      const json = await redis.get(key);
      return json ? (safeParse<T>(json) ?? null) : null;
    },
    null,
  );
}

/**
 * Cache a value in a Redis hash field.
 * Returns true if a new field was created, false if updated or failed.
 */
async function cacheHashField<T>(
  key: string,
  field: string,
  value: T,
): Promise<boolean> {
  return withRedis(
    `hset ${key}:${field}`,
    async (redis) =>
      (await redis.hset(key, field, JSON.stringify(value))) === 1,
    false,
  );
}

/**
 * Get a cached value from a Redis hash field.
 * Returns the parsed value if found, null otherwise.
 */
async function getCachedHashField<T>(
  key: string,
  field: string,
): Promise<T | null> {
  return withRedis<T | null>(
    `hget ${key}:${field}`,
    async (redis) => {
      const json = await redis.hget(key, field);
      return json ? (safeParse<T>(json) ?? null) : null;
    },
    null,
  );
}

/**
 * Execute multiple Redis operations atomically.
 * Returns true if all operations succeeded, false otherwise.
 */
async function cacheMulti(
  operations: (multi: ReturnType<Redis["multi"]>) => void,
): Promise<boolean> {
  return withRedis(
    "multi",
    async (redis) => {
      const multi = redis.multi();
      operations(multi);
      await multi.exec();
      return true;
    },
    false,
  );
}

// ============================================================================
// Cache Key Helpers
// ============================================================================

const RELAYS_KEY_PREFIX = "relays";
const PROFILE_KEY_PREFIX = "profile";
const EVENT_KEY_PREFIX = "event";
const ADDRESS_KEY_PREFIX = "address";
const ARTICLES_KEY_PREFIX = "articles";
const NIP05_NAMES = "nip05:names";
const NIP05_RELAYS = "nip05:relays";

function relaysKey(pubkey: string): string {
  return `${RELAYS_KEY_PREFIX}:${pubkey}`;
}

function profileKey(pubkey: string): string {
  return `${PROFILE_KEY_PREFIX}:${pubkey}`;
}

function eventKey(pointer: EventPointer): string {
  return `${EVENT_KEY_PREFIX}:${pointer.kind ?? kinds.ShortTextNote}:${pointer.id}`;
}

function addressKey(pointer: AddressPointer): string {
  return `${ADDRESS_KEY_PREFIX}:${pointer.kind}:${pointer.pubkey}:${pointer.identifier}`;
}

function articlesKey(pubkey: Pubkey): string {
  return `${ARTICLES_KEY_PREFIX}:${pubkey}`;
}

// ============================================================================
// Relay Cache
// ============================================================================

async function cacheNostrRelays(
  pubkey: string,
  relays: string[],
  username?: string,
): Promise<boolean> {
  const key = relaysKey(pubkey);
  const success = await cacheHashField(key, pubkey, relays);
  if (username) {
    await cacheNip05Relays(username, pubkey, relays);
  }
  return success;
}

async function getCachedRelays(pubkey: string): Promise<string[]> {
  const cached = await getCachedHashField<string[]>(relaysKey(pubkey), pubkey);
  return cached ?? [];
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

export async function syncProfile(
  pubkey: string,
  relays?: string[],
): Promise<ProfileContent | undefined> {
  const startTime = Date.now();
  console.log(`[sync:profile] Starting sync for pubkey: ${pubkey}`);
  console.log(
    `[sync:profile] Using ${relays?.length || 0} specific relays: ${relays ? JSON.stringify(relays) : "none, using INDEX_RELAYS"}`,
  );

  try {
    console.log(`[sync:profile] Fetching profile from nostr for ${pubkey}`);
    const profile = await fetchNostrProfile(pubkey, relays);

    if (profile) {
      console.log(
        `[sync:profile] Retrieved profile for ${pubkey}: ${JSON.stringify(profile)}`,
      );

      console.log(`[sync:profile] Caching profile for ${pubkey}`);
      await cacheNostrProfile(pubkey, profile);
      console.log(`[sync:profile] Cache operation successful for ${pubkey}`);

      const duration = Date.now() - startTime;
      console.log(
        `[sync:profile] Completed sync for ${pubkey} in ${duration}ms`,
      );
      return profile;
    } else {
      console.log(`[sync:profile] No profile found for ${pubkey}`);
      const duration = Date.now() - startTime;
      console.log(
        `[sync:profile] Completed sync for ${pubkey} in ${duration}ms (no data)`,
      );
      return undefined;
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(
      `[sync:profile] Error syncing profile for ${pubkey} after ${duration}ms:`,
      error,
    );
    throw error;
  }
}

// ============================================================================
// Profile Cache
// ============================================================================

async function cacheNostrProfile(
  pubkey: string,
  profile: ProfileContent,
): Promise<boolean> {
  return cacheValue(profileKey(pubkey), profile);
}

async function getCachedProfile(
  pubkey: string,
): Promise<ProfileContent | null> {
  return getCachedValue<ProfileContent>(profileKey(pubkey));
}

// ============================================================================
// NIP-05 Cache
// ============================================================================

const INVALID_USERNAMES = new Set([
  "faq",
  "write",
  "support",
  "bookmarks",
  "admin",
  "nostr",
  "wallet",
  "trending",
  "latest",
  "settings",
  "profile",
  "login",
  "logout",
  "signup",
  "signin",
  "register",
  "api",
  "help",
  "about",
  "contact",
  "terms",
  "privacy",
]);

export async function getUsername(username: string): Promise<string | null> {
  const cached = await withRedis<string | null>(
    `hget ${NIP05_NAMES}:${username}`,
    (redis) => redis.hget(NIP05_NAMES, username),
    null,
  );
  return cached ?? STATIC_NAMES[username] ?? null;
}

export async function saveUser({
  pubkey,
  username,
  relays,
}: {
  pubkey: Pubkey;
  username: string;
  relays: Relay[];
}): Promise<boolean> {
  return cacheMulti((multi) => {
    multi.hset(NIP05_NAMES, username, pubkey);
    multi.hset(NIP05_RELAYS, pubkey, JSON.stringify(relays));
  });
}

async function cacheNip05Relays(
  _username: string,
  pubkey: string,
  relays: string[],
): Promise<boolean> {
  return cacheHashField(NIP05_RELAYS, pubkey, relays);
}

export async function getNip05(): Promise<Nip05Data> {
  const cached = await withRedis<Nip05Data | null>(
    "nip05",
    async (redis) => {
      const response = await redis
        .multi()
        .hgetall(NIP05_NAMES)
        .hgetall(NIP05_RELAYS)
        .exec();

      const names = (response?.[0]?.[1] as Record<string, string>) || {};
      const relaysRaw = (response?.[1]?.[1] as Record<string, string>) || {};

      const relays: Record<string, string[]> = {};
      for (const [pubkey, relaysJson] of Object.entries(relaysRaw)) {
        relays[pubkey] = safeParse<string[]>(relaysJson) ?? [];
      }

      return { names, relays };
    },
    null,
  );

  // Static members are always present; Redis entries win on conflict.
  return {
    names: { ...STATIC_NAMES, ...(cached?.names ?? {}) },
    relays: cached?.relays ?? {},
  };
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
  const { names } = await getNip05();
  const results = await Promise.allSettled(
    Object.entries(names).map(async ([username, pubkey]) => {
      const profile = await fetchProfile({ pubkey });
      if (profile) return { username, pubkey, profile };
      throw new Error(
        `profile for ${username} with pubkey ${pubkey} not found`,
      );
    }),
  );
  return results.filter((r) => r.status === "fulfilled").map((r) => r.value);
}

export async function getArticles(
  pointer: Nip05Pointer,
): Promise<NostrEvent[]> {
  const { pubkey } = pointer;
  return withRedis<NostrEvent[]>(
    `articles ${pubkey}`,
    async (redis) => {
      const identifiers = await redis.smembers(articlesKey(pubkey));
      if (identifiers.length === 0) return [];
      const results = await redis.mget(
        identifiers.map((identifier) =>
          addressKey({ pubkey, kind: kinds.LongFormArticle, identifier }),
        ),
      );
      return results
        .map((result) => (result ? safeParse<NostrEvent>(result) : null))
        .filter((e): e is NostrEvent => Boolean(e));
    },
    [],
  );
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

// ============================================================================
// Event/Address Cache
// ============================================================================

async function getCachedAddress(
  pointer: AddressPointer,
): Promise<NostrEvent | undefined> {
  const cached = await getCachedValue<NostrEvent>(addressKey(pointer));
  return cached ?? undefined;
}

async function cacheAddress(
  pointer: AddressPointer,
  event: NostrEvent,
): Promise<boolean> {
  return cacheValue(addressKey(pointer), event);
}

async function getCachedEvent(
  pointer: EventPointer,
): Promise<NostrEvent | undefined> {
  const cached = await getCachedValue<NostrEvent>(eventKey(pointer));
  return cached ?? undefined;
}

async function cacheEvent(
  pointer: EventPointer,
  event: NostrEvent,
): Promise<boolean> {
  return cacheValue(eventKey(pointer), event);
}

async function cacheArticle(
  pointer: AddressPointer,
  article: NostrEvent,
): Promise<boolean> {
  return cacheMulti((multi) => {
    multi.set(addressKey(pointer), JSON.stringify(article));
    multi.sadd(articlesKey(article.pubkey), pointer.identifier);
  });
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
      .request(INDEX_RELAYS, {
        kinds: [kinds.RelayList],
        authors: [pubkey],
        limit: 1,
      })
      .pipe(
        timeout(NOSTR_TIMEOUT),
        map((ev) => getRelayURLs(ev).filter((r) => !r.startsWith("ws://"))),
        // A missing or slow relay list must not fail the whole page.
        catchError(() => of([] as string[])),
        defaultIfEmpty([] as string[]),
      ),
  );
}

async function fetchNostrProfile(
  pubkey: string,
  relays?: string[],
): Promise<ProfileContent | undefined> {
  return lastValueFrom(
    pool
      .request(INDEX_RELAYS.concat(relays ?? []), {
        kinds: [kinds.Metadata],
        authors: [pubkey],
        limit: 1,
      })
      .pipe(
        timeout(NOSTR_TIMEOUT),
        map(getProfileContent),
        catchError(() => of(undefined)),
        defaultIfEmpty(undefined),
      ),
  );
}

function fetchNostrAddress(pointer: AddressPointer): Promise<NostrEvent> {
  const { kind, pubkey, relays, identifier } = pointer;
  return firstValueFrom(
    pool
      .request(AGGREGATOR_RELAYS.concat(relays || []), {
        kinds: [kind],
        authors: [pubkey],
        "#d": [identifier],
      })
      .pipe(timeout(NOSTR_TIMEOUT)),
  );
}

function fetchNostrEvent(pointer: EventPointer): Promise<NostrEvent> {
  const { kind, author, id, relays } = pointer;
  return lastValueFrom(
    pool
      .request(AGGREGATOR_RELAYS.concat(relays || []), {
        ids: [id],
        ...(kind ? { kinds: [kind] } : { kinds: [kinds.ShortTextNote] }),
        ...(author ? { authors: [author] } : {}),
      })
      .pipe(timeout(NOSTR_TIMEOUT)),
  );
}

function fetchNostrArticles(pubkey: string, relays: string[]) {
  return lastValueFrom(
    pool
      .request(relays, {
        kinds: [kinds.LongFormArticle],
        authors: [pubkey],
      })
      .pipe(timeout(NOSTR_TIMEOUT), toArray()),
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
