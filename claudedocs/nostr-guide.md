# Nostr Protocol Guide

Comprehensive reference for working with Nostr in Habla.

## What is Nostr?

**Nostr** (Notes and Other Stuff Transmitted by Relays) is a simple, decentralized protocol for social networking. It doesn't rely on trusted central servers—all data is cryptographically signed by users and distributed via relay servers.

## Event Structure

All data in Nostr is represented as **events**—JSON objects with:

```json
{
  "id": "event-hash",           // SHA256 hash
  "pubkey": "author-pubkey",    // 32-byte hex
  "created_at": 1234567890,     // Unix timestamp
  "kind": 1,                    // Event type
  "tags": [["e", "..."]],       // Array of tags
  "content": "Hello Nostr!",    // Event content
  "sig": "signature"            // Schnorr signature
}
```

## Event Kinds in Habla

```typescript
// From app/const.ts
export const kinds = {
  Metadata: 0,           // User profile
  ShortNote: 1,          // Short text note
  LongFormArticle: 30023,  // Blog post (NIP-23)
  Book: 30040,           // Book
  BookChapter: 30041,    // Book chapter
  Comment: 1111,         // Comment/reply
  ZapReceipt: 9735,      // Lightning payment receipt
  BlossomServerList: 10063,  // File server list
};
```

## Relays

WebSocket servers that store and distribute events:

```typescript
// From app/const.ts
export const INDEX_RELAYS = [
  "wss://purplepag.es",
  "wss://relay.nostr.band"
];

export const AGGREGATOR_RELAYS = [
  "wss://relay.nostr.band",
  "wss://relay.primal.net"
];
```

## Cryptographic Keys

- **Private Key (nsec)** - Secret key for signing (32 bytes, bech32 encoded)
- **Public Key (npub)** - Public identity (32 bytes hex or bech32)
- Never log or expose private keys!
- Use `nostr-tools` for all crypto operations

## Nostr Pointers

Special identifiers for referencing entities:

| Type | Format | Usage |
|------|--------|-------|
| **naddr** | Address pointer | kind + pubkey + identifier + relays |
| **nevent** | Event pointer | event ID + relays |
| **nprofile** | Profile pointer | pubkey + relays |

## NIP-05 Identity

DNS-based identity verification (like email):

- Format: `alice@example.com`
- Verifies at `https://example.com/.well-known/nostr.json`
- Maps names to public keys
- See `app/routes/nip05.ts` for implementation

## Common Operations

### Fetch a Profile

```typescript
import { fetchProfile } from "~/services/nostr";

const profile = await fetchProfile({
  pubkey: "hex-pubkey",
  relays: INDEX_RELAYS
});
// Returns: { name, about, picture, nip05, ... }
```

### Fetch an Article (Address)

```typescript
import { fetchAddress } from "~/services/nostr";

const article = await fetchAddress({
  kind: 30023,
  pubkey: "hex-pubkey",
  identifier: "article-slug",
  relays: INDEX_RELAYS
});
```

### Fetch an Event

```typescript
import { fetchEvent } from "~/services/nostr";

const event = await fetchEvent({
  id: "event-id",
  relays: INDEX_RELAYS
});
```

### Subscribe to Events

```typescript
import { useSubscription } from "~/hooks/nostr.client";

const { events } = useSubscription({
  relays: ["wss://relay.nostr.band"],
  filters: [{ kinds: [1], limit: 20 }]
});
```

### Publish an Event

```typescript
import { usePublisher } from "applesauce-react/hooks";
import { useEventFactory } from "applesauce-react/hooks";

const publisher = usePublisher();
const factory = useEventFactory();

const event = factory.note("Hello Nostr!");
await publisher.publish(event, relays);
```

### Create an Article

```typescript
const factory = useEventFactory();
const article = factory.longFormArticle({
  title: "My Article",
  content: "Article content in markdown...",
  identifier: "my-article-slug",
  tags: ["nostr", "decentralization"]
});

await publisher.publish(article, relays);
```

## Event Filters

Use filters to query specific events:

```typescript
// By kind
{ kinds: [1, 30023] }

// By author
{ authors: ["pubkey1", "pubkey2"] }

// By tag
{ "#t": ["nostr"] }  // Hashtag
{ "#p": ["pubkey"] } // Mention

// By time range
{ since: 1234567890, until: 1234599999 }

// Limit results
{ limit: 20 }
```

## Working with Relay Pool

```typescript
import { relayPool } from "~/services/relay-pool";

// Subscribe to events
const subscription = relayPool.subscribe(
  ["wss://relay.nostr.band"],
  [{ kinds: [1], limit: 20 }]
);

subscription.on("event", (relay, event) => {
  console.log("Received event:", event);
});

// Publish to multiple relays
await relayPool.publish(event, ["wss://relay1", "wss://relay2"]);

// Close subscription when done
subscription.close();
```

## Event Store (IndexedDB Cache)

```typescript
import { useEventStore } from "applesauce-react/hooks";

const eventStore = useEventStore();

// Get cached event
const event = await eventStore.getEvent(eventId);

// Add event to cache
await eventStore.addEvent(event);

// Query cached events
const events = await eventStore.query({
  kinds: [1],
  limit: 20
});
```

## NIPs (Nostr Implementation Possibilities)

Relevant NIPs used in Habla:

- **NIP-01** - Basic protocol flow
- **NIP-05** - DNS-based identity verification
- **NIP-19** - bech32 encoding (npub, nsec, note, naddr, nevent, nprofile)
- **NIP-23** - Long-form content (kind 30023)
- **NIP-27** - Text note references
- **NIP-57** - Lightning Zaps
- **NIP-65** - Relay list metadata

## URL Schemes in Habla

```
/a/:naddr              # Nostr address viewer
/e/:nevent             # Event viewer
/p/:nprofile           # Profile viewer
/u/:nip05              # NIP-05 profile
/u/:nip05/:identifier  # NIP-05 article
/:username             # Username profile
/:username/:identifier # Username article
/t/:tag                # Hashtag feed
/relay/:relay          # Relay feed
```

## Best Practices

1. **Always validate signatures** - Don't trust unverified events
2. **Connect to multiple relays** - Increases availability and censorship resistance
3. **Cache aggressively** - Use IndexedDB and Redis to minimize network requests
4. **Close subscriptions** - Prevent memory leaks by closing when components unmount
5. **Handle relay failures** - Not all relays are always available
6. **Never expose private keys** - Keep nsec secure, use signers
7. **Batch requests** - Query multiple events at once when possible

## Resources

- [Nostr Protocol Spec](https://github.com/nostr-protocol/nostr)
- [NIPs Repository](https://github.com/nostr-protocol/nips)
- [nostr-tools](https://github.com/nbd-wtf/nostr-tools)
