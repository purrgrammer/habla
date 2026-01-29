# Applesauce Libraries Guide

Comprehensive reference for working with the Applesauce suite in Habla.

## Package Overview

Habla uses the **Applesauce** suite of Nostr client libraries:

| Package                     | Version | Purpose                                     |
| --------------------------- | ------- | ------------------------------------------- |
| `applesauce-core`           | ^3.0.0  | Core Nostr event helpers and utilities      |
| `applesauce-loaders`        | ^3.0.0  | Data loading utilities for profiles, events |
| `applesauce-relay`          | ^3.0.0  | Relay pool and WebSocket management         |
| `applesauce-signers`        | ^3.0.0  | Key signing and account management          |
| `applesauce-react`          | ^3.0.0  | React hooks and providers                   |
| `applesauce-actions`        | ^3.0.0  | Action management system                    |
| `applesauce-factory`        | ^3.0.0  | Event creation and modification             |
| `applesauce-wallet-connect` | ^3.0.0  | NWC (Nostr Wallet Connect) support          |
| `applesauce-accounts`       | ^4.1.0  | Multi-account management                    |
| `applesauce-content`        | ^3.0.0  | Content parsing and rendering               |

## Provider Setup

All providers are configured in `/home/user/habla/app/entry.client.tsx`:

```typescript
import { EventStoreProvider } from "applesauce-react/hooks";
import { AccountsProvider } from "applesauce-accounts/provider";
import { FactoryProvider } from "applesauce-factory/provider";
import { ActionHubProvider } from "applesauce-actions/provider";

<EventStoreProvider db={db} relayPool={pool}>
  <AccountsProvider store={accountsStore}>
    <FactoryProvider>
      <ActionHubProvider hub={actionHub}>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </ActionHubProvider>
    </FactoryProvider>
  </AccountsProvider>
</EventStoreProvider>
```

**Do not modify this setup unless necessary.** These providers are already configured correctly.

## Core Hooks

### useEventStore

Access the IndexedDB event cache:

```typescript
import { useEventStore } from "applesauce-react/hooks";

const eventStore = useEventStore();

// Get event by ID
const event = await eventStore.getEvent(eventId);

// Add event to cache
await eventStore.addEvent(event);

// Query cached events
const events = await eventStore.query({
  kinds: [1],
  limit: 20,
});
```

### useCurrentAccount

Get the currently logged-in user:

```typescript
import { useCurrentAccount } from "applesauce-accounts/hooks";

const account = useCurrentAccount();

if (account) {
  console.log(account.pubkey); // User's public key
  console.log(account.signer); // Signer instance
}
```

### useEventFactory

Create Nostr events:

```typescript
import { useEventFactory } from "applesauce-react/hooks";

const factory = useEventFactory();

// Create a note (kind 1)
const note = factory.note("Hello Nostr!");

// Create an article (kind 30023)
const article = factory.longFormArticle({
  title: "My Article",
  content: "Article content in markdown...",
  identifier: "my-article-slug",
  tags: ["nostr", "technology"],
});

// Create a comment (kind 1111)
const comment = factory.comment("Great article!", articleEvent);

// Create a reaction
const reaction = factory.reaction(event, "+");
```

### usePublisher

Publish events to relays:

```typescript
import { usePublisher } from "applesauce-react/hooks";
import { COMMON_RELAYS } from "~/const";

const publisher = usePublisher();

// Publish to relays
await publisher.publish(event, COMMON_RELAYS);

// Publish with status callback
await publisher.publish(event, relays, (status) => {
  console.log("Status:", status);
});
```

### useSubscription

Subscribe to real-time events:

```typescript
import { useSubscription } from "applesauce-react/hooks";

const { events, eose } = useSubscription({
  relays: ["wss://relay.nostr.band"],
  filters: [{ kinds: [1], limit: 20 }],
  enabled: true, // Can toggle on/off
});

// events: array of received events
// eose: true when relay sends end-of-stored-events
```

## Data Loaders

Efficient, pre-built data loading utilities in `/home/user/habla/app/services/loaders.client.ts` and `loaders.server.ts`.

### createProfileLoader

```typescript
import { createProfileLoader } from "applesauce-loaders";
import { relayPool } from "~/services/relay-pool";
import { INDEX_RELAYS } from "~/const";

const profileLoader = createProfileLoader(relayPool, INDEX_RELAYS);

// Load a profile
const profile = await profileLoader(pubkey);
// Returns: { name, about, picture, nip05, ... }
```

### createTimelineLoader

```typescript
import { createTimelineLoader } from "applesauce-loaders";
import { firstValueFrom } from "rxjs";
import { toArray } from "rxjs/operators";

const timelineLoader = createTimelineLoader(relayPool, relays, [
  { kinds: [1], limit: 20 },
]);

// Load timeline events
const events = await firstValueFrom(timelineLoader(since).pipe(toArray()));
```

### createAddressLoader

```typescript
import { createAddressLoader } from "applesauce-loaders";

const addressLoader = createAddressLoader(relayPool, relays);

// Load an article by address
const article = await addressLoader({
  kind: 30023,
  pubkey: "hex-pubkey",
  identifier: "article-slug",
});
```

## Account Management

### Multi-Account Support

```typescript
import { useAccountsStore } from "applesauce-accounts/hooks";

const accountsStore = useAccountsStore();

// Get all accounts
const accounts = accountsStore.getAccounts();

// Switch account
accountsStore.setCurrentAccount(pubkey);

// Add account
await accountsStore.addAccount(signer);

// Remove account
accountsStore.removeAccount(pubkey);
```

### Signers

```typescript
import { useCurrentAccount } from "applesauce-accounts/hooks";

const account = useCurrentAccount();

if (account?.signer) {
  // Sign an event
  const signed = await account.signer.sign(event);

  // Get public key
  const pubkey = await account.signer.getPublicKey();
}
```

## Action System

Track and dispatch user actions across the app (configured in `/home/user/habla/app/services/action-hub.client.ts`):

```typescript
import { useActionHub } from "applesauce-actions/hooks";

const actionHub = useActionHub();

// Register action handler
actionHub.on("publish", (event) => {
  console.log("Published:", event);
});

// Dispatch action
actionHub.dispatch({
  type: "publish",
  event: event,
});
```

## Common Patterns

### Loading a User Profile

```typescript
import { useQuery } from "@tanstack/react-query";
import { fetchProfile } from "~/services/nostr";
import { INDEX_RELAYS } from "~/const";

export function UserProfile({ pubkey }: { pubkey: string }) {
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", pubkey],
    queryFn: () => fetchProfile({ pubkey, relays: INDEX_RELAYS })
  });

  if (isLoading) return <div>Loading...</div>;
  if (!profile) return <div>Profile not found</div>;

  return (
    <div>
      <h1>{profile.name}</h1>
      <p>{profile.about}</p>
    </div>
  );
}
```

### Publishing an Article

```typescript
import { usePublisher, useEventFactory } from "applesauce-react/hooks";
import { COMMON_RELAYS } from "~/const";
import { toast } from "sonner";

export function PublishButton({ title, content, identifier }) {
  const publisher = usePublisher();
  const factory = useEventFactory();

  async function handlePublish() {
    try {
      const article = factory.longFormArticle({
        title,
        content,
        identifier
      });

      await publisher.publish(article, COMMON_RELAYS);
      toast.success("Article published!");
    } catch (error) {
      toast.error("Failed to publish");
      console.error(error);
    }
  }

  return <button onClick={handlePublish}>Publish</button>;
}
```

### Real-Time Event Subscription

```typescript
import { useSubscription } from "applesauce-react/hooks";

export function RealtimeFeed() {
  const { events, eose } = useSubscription({
    relays: ["wss://relay.nostr.band"],
    filters: [{ kinds: [1], limit: 50 }]
  });

  return (
    <div>
      {!eose && <div>Loading...</div>}
      {events.map(event => (
        <div key={event.id}>{event.content}</div>
      ))}
    </div>
  );
}
```

### Caching Events in IndexedDB

```typescript
import { useEventStore } from "applesauce-react/hooks";
import { useEffect } from "react";

export function EventCacher({ event }) {
  const eventStore = useEventStore();

  useEffect(() => {
    // Cache event when component mounts
    eventStore.addEvent(event);
  }, [event, eventStore]);

  return null;
}
```

## Important Files

### Client-Side Services

- `/home/user/habla/app/services/loaders.client.ts` - Client-side data loaders
- `/home/user/habla/app/services/accounts.client.ts` - Account management setup
- `/home/user/habla/app/services/action-hub.client.ts` - Action hub configuration
- `/home/user/habla/app/services/event-factory.client.ts` - Event factory utilities

### Server-Side Services

- `/home/user/habla/app/services/loaders.server.ts` - Server-side data loaders
- `/home/user/habla/app/services/data.server.ts` - Server data store with Redis

### Entry Points

- `/home/user/habla/app/entry.client.tsx` - Provider setup and client hydration

## Best Practices

1. **Use loaders for data fetching** - Don't fetch data directly in components
2. **Cache events in EventStore** - Reduces network requests
3. **Use React Query for client state** - Works well with Applesauce
4. **Don't modify provider setup** - It's already configured correctly
5. **Use factory for event creation** - Ensures correct event structure
6. **Always handle publish errors** - Network can fail
7. **Close subscriptions on unmount** - Prevent memory leaks

## TypeScript Types

All Applesauce packages include TypeScript types. Import from package root:

```typescript
import type { NostrEvent } from "applesauce-core";
import type { Signer } from "applesauce-signers";
import type { AddressPointer } from "applesauce-core";
```

## Debugging

Enable debug logging for Applesauce libraries:

```typescript
// In browser console
localStorage.debug = "applesauce:*";

// Specific packages
localStorage.debug = "applesauce:relay,applesauce:loader";
```

## Resources

- Package documentation in `node_modules/applesauce-*/README.md`
- TypeScript types provide inline documentation
- Check source code in `node_modules/applesauce-*` for advanced usage
