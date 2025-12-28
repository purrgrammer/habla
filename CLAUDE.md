# Claude Code Documentation

This is a **Nostr-based long-form content platform** built with React Router v7. Users can read, write, and publish articles on a decentralized protocol using cryptographic keys.

## Quick Start

```bash
npm run dev        # Start dev server (localhost:5173)
npm run build      # Production build
npm run typecheck  # Type check (run after route changes)
npm run start      # Serve production build
```

## Core Architecture

**Tech Stack:**
- React Router v7 (SSR framework)
- Nostr Protocol (decentralized social protocol)
- Applesauce Suite (Nostr client libraries)
- TipTap v3 (rich text editor)
- Tailwind CSS v4 + Radix UI
- TanStack Query v5

**Key Patterns:**
- `.client.tsx` = browser-only code (hooks, DOM APIs, interactive components)
- `.server.ts` = server-only code (Redis, external APIs, data fetching)
- `.tsx/.ts` = isomorphic code (runs on both client and server)
- `~/` = import alias for `./app/`

## Project Structure

```
app/
├── routes/          # File-based routing (loader + component)
├── services/        # Business logic & data fetching
│   ├── nostr.ts              # Nostr protocol wrappers
│   ├── data.{server,client}  # Data stores (Redis/IndexedDB)
│   ├── loaders.{server,client}  # Data loaders
│   ├── relay-pool.ts         # WebSocket relay management
│   └── event-store.ts        # Event caching
├── ui/              # React components
│   ├── layouts/     # Page layouts (main, editor)
│   ├── nostr/       # Nostr-specific UI (articles, profiles, zaps)
│   └── editor/      # TipTap editor components
├── lib/             # Utilities (cn function, URL parsing, etc.)
├── hooks/           # Custom React hooks
└── const.ts         # Constants (event kinds, relay URLs)
```

## Key Concepts

**Nostr Basics:**
- Events are signed JSON objects with kinds (0=profile, 1=note, 30023=article)
- Relays are WebSocket servers that store/distribute events
- All data is cryptographically signed by users
- See `claudedocs/nostr-guide.md` for detailed protocol documentation

**Applesauce Libraries:**
- React hooks and providers for Nostr integration
- Pre-configured in `app/entry.client.tsx`
- See `claudedocs/applesauce-guide.md` for detailed API documentation

## Common Patterns

**Data Fetching:**

```typescript
// Server-side (in route loaders)
import { dataStore } from "~/services/data.server";
export async function loader() {
  const profile = await dataStore.fetchProfile({ pubkey, relays });
  return { profile };
}

// Client-side (with React Query)
import { useQuery } from "@tanstack/react-query";
const { data } = useQuery({
  queryKey: ["profile", pubkey],
  queryFn: () => fetchProfile({ pubkey, relays })
});
```

**Styling:**

```typescript
import { cn } from "~/lib/utils";
<div className={cn("base-class", condition && "conditional-class")} />
```

**Publishing Events:**

```typescript
import { usePublisher, useEventFactory } from "applesauce-react/hooks";
const publisher = usePublisher();
const factory = useEventFactory();
const event = factory.note("Hello!");
await publisher.publish(event, relays);
```

## Important Files

- `app/const.ts` - Event kinds, relay URLs, constants
- `app/routes.ts` - Route configuration
- `app/featured.ts` - Featured users/articles
- `react-router.config.ts` - Prerendering config
- `vite.config.ts` - Build configuration

## Documentation Index

**Read these on-demand when working with:**
- **Nostr protocol** → `claudedocs/nostr-guide.md`
- **Applesauce libraries** → `claudedocs/applesauce-guide.md`
- **Implementation tasks** → `claudedocs/common-tasks.md`

## Development Notes

- Always run `npm run typecheck` after route changes
- Server-side data is cached in Redis (optional, defaults to localhost)
- Client-side events cached in IndexedDB via `event-store.ts`
- Drafts saved to localStorage (`services/drafts.client.ts`)
- Featured content hardcoded in `app/featured.ts`
