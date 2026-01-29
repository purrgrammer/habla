# Claude Code Documentation

This is a **Nostr-based long-form content platform** built with React Router v7. Users can read, write, and publish articles on a decentralized protocol using cryptographic keys.

## Quick Start

```bash
npm run dev        # Start dev server (localhost:5173)
npm run build      # Production build
npm run typecheck  # Type check (run after route changes)
npm run start      # Serve production build
```

## Verification Requirement

**Before marking any task complete, verify changes work correctly:**

```bash
npm run build && npm run typecheck
```

This catches type errors and build issues early. Always run this before committing.

## Core Architecture

**Tech Stack:**

- React Router v7 (SSR framework)
- Nostr Protocol (decentralized social protocol)
- Applesauce Suite v3/v4 (Nostr client libraries)
- TipTap v3 (rich text editor)
- Tailwind CSS v4 + Radix UI
- TanStack Query v5
- RxJS (reactive data streams)

**Key Patterns:**

- `.client.tsx` = browser-only code (hooks, DOM APIs, interactive components)
- `.server.ts` = server-only code (Redis, external APIs, data fetching)
- `.tsx/.ts` = isomorphic code (runs on both client and server)
- `~/` = import alias for `./app/`

## Data Architecture

### Dual Data Fetching System

The app uses different data stores for server and client:

**Server-Side (`app/services/data.server.ts`):**

- Redis cache for profiles, relays, events, articles
- Falls back gracefully when Redis is unavailable (`isRedisOffline` mode)
- Cache keys: `profile:{pubkey}`, `relays:{pubkey}`, `address:{kind}:{pubkey}:{identifier}`
- Used in route loaders for SSR

```typescript
// In route loader
import dataStore from "~/services/data.server";

export async function loader({ params }: Route.LoaderArgs) {
  const profile = await dataStore.fetchProfile({ pubkey: params.pubkey });
  return { profile };
}
```

**Client-Side (`app/services/loaders.ts`):**

- EventStore (IndexedDB) as single source of truth for Nostr events
- Applesauce loaders with batching and relay hints
- Reactive updates via RxJS observables

```typescript
// Three main loaders
import { addressLoader, eventLoader, profileLoader } from "~/services/loaders";

// addressLoader - for replaceable events (articles, profiles)
// eventLoader - for regular events by ID
// profileLoader - optimized for profiles with batching (bufferTime: 50, bufferSize: 100)
```

### State Management

**EventStore** is the single source of truth for all Nostr events on the client:

```typescript
import { useEventStore } from "applesauce-react/hooks";
import { useObservableMemo } from "applesauce-react/hooks";

const eventStore = useEventStore();

// Subscribe to reactive updates
const event = useObservableMemo(() => {
  return eventStore.replaceable(kind, pubkey, identifier);
}, [kind, pubkey, identifier]);
```

**TanStack Query** for async state management and caching of derived data.

## Key Hooks (`app/hooks/nostr.ts`)

| Hook                               | Purpose                                       |
| ---------------------------------- | --------------------------------------------- |
| `useProfile(pubkey)`               | Load and subscribe to a user's profile        |
| `useEvent(pointer)`                | Load event by EventPointer                    |
| `useAddress(pointer)`              | Load replaceable event by AddressPointer      |
| `useRelays(pubkey)`                | Get user's relay list                         |
| `useInboxRelays(pubkey)`           | Get user's inbox (read) relays                |
| `useTimeline(id, filters, relays)` | Load and subscribe to a timeline              |
| `useZaps(event)`                   | Load zaps for an event with real-time updates |

**Pattern:** Hooks combine loader subscription + EventStore observation:

```typescript
export function useEvent(pointer: EventPointer) {
  const eventStore = useEventStore();

  // Reactive subscription to EventStore
  const event = useObservableMemo(() => {
    return eventStore.event(pointer.id);
  }, [pointer]);

  // Trigger loader on mount
  useEffect(() => {
    const subscription = eventLoader(pointer).subscribe();
    return () => subscription.unsubscribe();
  }, [pointer]);

  return event;
}
```

## Applesauce Patterns

**Helpers cache computed values internally using symbols. You don't need `useMemo` when calling applesauce helpers.**

```typescript
import {
  getProfileContent,
  getTagValue,
  getZapPayment,
} from "applesauce-core/helpers";

// These are already cached - no useMemo needed
const profile = getProfileContent(event);
const title = getTagValue(event, "title");
```

**Models** provide reactive computed state:

```typescript
import { ProfileModel } from "applesauce-core/models";
import { EventZapsModel } from "applesauce-core/models/zaps";

const profile = useObservableMemo(() => {
  return eventStore.model(ProfileModel, pubkey);
}, [pubkey]);
```

## Project Structure

```
app/
├── routes/          # File-based routing (loader + component)
├── services/        # Business logic & data fetching
│   ├── data.server.ts        # Redis cache + Nostr fetching (server)
│   ├── loaders.ts            # Applesauce loaders (client)
│   ├── relay-pool.ts         # WebSocket relay management
│   └── event-store.ts        # IndexedDB event cache
├── ui/              # React components
│   ├── layouts/     # Page layouts (main, editor)
│   ├── nostr/       # Nostr-specific UI (articles, profiles, zaps)
│   └── editor/      # TipTap editor components
├── hooks/           # Custom React hooks
│   └── nostr.ts     # useProfile, useEvent, useTimeline, etc.
├── lib/             # Utilities (cn function, URL parsing, etc.)
└── const.ts         # Constants (event kinds, relay URLs)
```

## Constants (`app/const.ts`)

```typescript
INDEX_RELAYS; // For profile/relay lookups: purplepag.es, vertexlab.io
AGGREGATOR_RELAYS; // For content: damus.io, nos.lol, primal.net
COMMENT; // Kind 1111 for comments
BOOK; // Kind 30040 for books
BOOK_CHAPTER; // Kind 30041 for chapters
```

## Common Patterns

**Publishing Events:**

```typescript
import { usePublisher, useEventFactory } from "applesauce-react/hooks";

const publisher = usePublisher();
const factory = useEventFactory();

// Create and publish
const article = factory.longFormArticle({ title, content, identifier });
await publisher.publish(article, relays);
```

**Styling with cn():**

```typescript
import { cn } from "~/lib/utils";
<div className={cn("base-class", condition && "conditional-class")} />
```

**Error Handling:**

```typescript
import { toast } from "sonner";

try {
  await publisher.publish(event, relays);
  toast.success("Published!");
} catch (error) {
  toast.error("Failed to publish");
  console.error(error);
}
```

## Important Files

- `app/const.ts` - Event kinds, relay URLs, constants
- `app/routes.ts` - Route configuration
- `app/hooks/nostr.ts` - Core Nostr hooks
- `app/services/data.server.ts` - Server-side data with Redis
- `app/services/loaders.ts` - Client-side applesauce loaders
- `app/featured.ts` - Featured users/articles

## Documentation Index

**Read these on-demand when working with:**

- **Nostr protocol** → `claudedocs/nostr-guide.md`
- **Applesauce libraries** → `claudedocs/applesauce-guide.md`
- **Implementation tasks** → `claudedocs/common-tasks.md`

## Development Notes

- Always run `npm run build && npm run typecheck` before committing
- Server-side data cached in Redis (optional, graceful fallback)
- Client-side events cached in IndexedDB via EventStore
- Drafts saved to localStorage (`services/drafts.client.ts`)
- Featured content hardcoded in `app/featured.ts`
- Use `useObservableMemo` for reactive EventStore subscriptions
