# Claude Code Documentation for Habla

This documentation helps Claude Code understand and work effectively with the Habla codebase.

## Table of Contents

- [Project Overview](#project-overview)
- [Development Commands](#development-commands)
- [Architecture](#architecture)
- [Nostr Protocol Guide](#nostr-protocol-guide)
- [Applesauce Library Guide](#applesauce-library-guide)
- [Code Patterns & Conventions](#code-patterns--conventions)
- [File Organization](#file-organization)
- [Claude Skills](#claude-skills)
- [Common Tasks](#common-tasks)

---

## Project Overview

**Habla** is a decentralized long-form content platform built on the Nostr protocol. Users can read, write, and publish articles without centralized servers, using cryptographic keys for identity and WebSocket relays for data distribution.

### Tech Stack

- **React Router v7** - Full-stack React framework with SSR
- **Nostr Protocol** - Decentralized social media protocol
- **Applesauce Suite** - Comprehensive Nostr client libraries
- **TipTap v3** - Rich text editor
- **Tailwind CSS v4** - Styling
- **Radix UI** - Accessible component primitives
- **TanStack React Query v5** - Server state management
- **Blossom** - Decentralized file hosting

### Core Features

1. **Read** - Browse long-form articles and notes from the Nostr network
2. **Write** - Rich-text editor with Markdown support
3. **Publish** - Cryptographically sign and broadcast articles to relays
4. **Discover** - Find content by hashtags, relays, and users
5. **Zap** - Send/receive Bitcoin Lightning payments
6. **Bookmark** - Save articles for later

---

## Development Commands

### Start Development Server

```bash
npm run dev
```

- Starts React Router dev server with HMR
- Available at http://localhost:5173
- Hot reloads on file changes

### Build for Production

```bash
npm run build
```

- Creates production build using React Router
- Outputs to `build/` directory with client and server assets
- Includes prerendered pages for featured content

### Type Checking

```bash
npm run typecheck
```

- Runs React Router type generation and TypeScript compiler
- **Must be run after making route changes**
- Validates all types across the codebase

### Start Production Server

```bash
npm run start
```

- Serves the built application
- Requires successful `npm run build` first

### Utility Scripts

```bash
npm run sync          # Synchronize Nostr data
npm run add-npub      # Add Nostr public key to featured users
```

---

## Architecture

### Application Structure

```
app/
├── routes/              # Route handlers (file-based routing)
├── services/            # Business logic and data fetching
│   ├── nostr.ts         # Nostr protocol functions
│   ├── loaders.*.ts     # Data loading utilities
│   ├── data.*.ts        # Data stores (server/client)
│   ├── relay-pool.ts    # WebSocket relay management
│   └── event-store.ts   # Local event caching
├── ui/                  # React components
│   ├── layouts/         # Page layouts
│   ├── nostr/           # Nostr-specific components
│   └── editor/          # Editor components
├── lib/                 # Utility functions
├── hooks/               # React hooks
└── nostr/               # Nostr-specific logic
```

### Client/Server Separation

- **`.client.tsx`** - Browser-only components (use hooks, DOM APIs)
- **`.server.ts`** - Server-only functions (database, Redis, external APIs)
- **`.tsx` / `.ts`** - Isomorphic code (runs on both client and server)

### Data Flow

1. **Server-Side Rendering (SSR)**
   - React Router `loader()` fetches data on server
   - HTML rendered with initial data
   - Sent to client for hydration

2. **Client-Side Hydration**
   - React Router `clientLoader()` can override or supplement server data
   - TanStack React Query manages client state
   - EventStore caches Nostr events in IndexedDB

3. **Real-Time Updates**
   - WebSocket connections to Nostr relays
   - RxJS streams for reactive data flow
   - Event subscriptions update UI automatically

---

## Nostr Protocol Guide

### What is Nostr?

**Nostr** (Notes and Other Stuff Transmitted by Relays) is a simple, decentralized protocol for social networking. It doesn't rely on trusted central servers—all data is cryptographically signed by users and distributed via relay servers.

### Key Concepts

#### Events

All data in Nostr is represented as **events**—JSON objects with:

- `id` - SHA256 hash of the event
- `pubkey` - Public key of the author (hex)
- `created_at` - Unix timestamp
- `kind` - Event type (0 = profile, 1 = note, 30023 = article)
- `tags` - Array of tags (metadata, references)
- `content` - Event content (text, JSON)
- `sig` - Schnorr signature

#### Event Kinds Used in Habla

```typescript
0      // User metadata (profile)
1      // Short text note
30023  // Long-form article (NIP-23)
30040  // Book
30041  // Book chapter
1111   // Comment
9735   // Zap receipt (Lightning payment)
10063  // Blossom server list
```

#### Relays

WebSocket servers that store and distribute events:

- **INDEX_RELAYS** - `["wss://purplepag.es", "wss://relay.nostr.band"]`
- **AGGREGATOR_RELAYS** - `["wss://relay.nostr.band", "wss://relay.primal.net"]`

Connect via WebSocket, send REQ subscriptions, receive EVENT messages.

#### Keys

- **Private Key (nsec)** - Secret key for signing events (32 bytes, bech32 encoded)
- **Public Key (npub)** - Public identity (32 bytes hex or bech32)
- Never share or log private keys!

#### NIP-05 Identity

DNS-based identity verification (like email):

- User: `alice@example.com`
- Verifies at `https://example.com/.well-known/nostr.json`
- Maps names to public keys

### Nostr Pointers

Special identifiers for referencing Nostr entities:

- **naddr** - Address pointer (kind + pubkey + identifier)
- **nevent** - Event pointer (event ID + relays)
- **nprofile** - Profile pointer (pubkey + relays)

### Common Nostr Operations

#### Fetch a Profile

```typescript
import { fetchProfile } from "~/services/nostr";

const profile = await fetchProfile({
  pubkey: "hex-pubkey",
  relays: ["wss://relay.nostr.band"]
});
// Returns: { name, about, picture, nip05, ... }
```

#### Fetch an Article

```typescript
import { fetchAddress } from "~/services/nostr";

const article = await fetchAddress({
  kind: 30023,
  pubkey: "hex-pubkey",
  identifier: "article-slug",
  relays: ["wss://relay.nostr.band"]
});
```

#### Publish an Event

```typescript
import { usePublisher } from "applesauce-react/hooks";
import { useEventFactory } from "applesauce-react/hooks";

const publisher = usePublisher();
const factory = useEventFactory();

const event = factory.note("Hello Nostr!");
await publisher.publish(event, relays);
```

#### Subscribe to Events

```typescript
import { useSubscription } from "~/hooks/nostr.client";

const { events } = useSubscription({
  relays: ["wss://relay.nostr.band"],
  filters: [{ kinds: [1], limit: 20 }]
});
```

---

## Applesauce Library Guide

Habla heavily uses the **Applesauce** suite of Nostr client libraries. These provide high-level abstractions for working with Nostr.

### Applesauce Packages

| Package | Purpose |
|---------|---------|
| `applesauce-core` | Core Nostr event helpers and utilities |
| `applesauce-loaders` | Data loading utilities for profiles, events |
| `applesauce-relay` | Relay pool and WebSocket management |
| `applesauce-signers` | Key signing and account management |
| `applesauce-react` | React hooks and providers |
| `applesauce-actions` | Action management system |
| `applesauce-factory` | Event creation and modification |
| `applesauce-wallet-connect` | NWC (Nostr Wallet Connect) support |
| `applesauce-accounts` | Multi-account management |
| `applesauce-content` | Content parsing and rendering |

### Applesauce Providers

Wrap your app with these providers (already in `/home/user/habla/app/entry.client.tsx`):

```typescript
import { EventStoreProvider } from "applesauce-react/hooks";
import { AccountsProvider } from "applesauce-accounts/provider";
import { FactoryProvider } from "applesauce-factory/provider";
import { ActionHubProvider } from "applesauce-actions/provider";

<EventStoreProvider db={db} relayPool={pool}>
  <AccountsProvider store={accountsStore}>
    <FactoryProvider>
      <ActionHubProvider hub={actionHub}>
        {children}
      </ActionHubProvider>
    </FactoryProvider>
  </AccountsProvider>
</EventStoreProvider>
```

### Applesauce Hooks

#### useEventStore

Access the IndexedDB event cache:

```typescript
import { useEventStore } from "applesauce-react/hooks";

const eventStore = useEventStore();
const event = await eventStore.getEvent(eventId);
```

#### useAccount

Get the current logged-in user:

```typescript
import { useCurrentAccount } from "applesauce-accounts/hooks";

const account = useCurrentAccount();
// account.pubkey, account.signer
```

#### useEventFactory

Create Nostr events:

```typescript
import { useEventFactory } from "applesauce-react/hooks";

const factory = useEventFactory();

// Create a note
const note = factory.note("Hello!");

// Create an article
const article = factory.longFormArticle({
  title: "My Article",
  content: "Article content...",
  identifier: "my-article"
});
```

#### usePublisher

Publish events to relays:

```typescript
import { usePublisher } from "applesauce-react/hooks";

const publisher = usePublisher();

await publisher.publish(event, relays);
```

### Applesauce Data Loaders

Efficient data loading utilities:

```typescript
import { createProfileLoader } from "applesauce-loaders";
import { createTimelineLoader } from "applesauce-loaders";

// Profile loader
const profileLoader = createProfileLoader(pool, relays);
const profile = await profileLoader(pubkey);

// Timeline loader
const timelineLoader = createTimelineLoader(pool, relays, filters);
const events = await firstValueFrom(timelineLoader(since).pipe(toArray()));
```

### Applesauce Actions

Track user actions across the app:

```typescript
import { useActionHub } from "applesauce-actions/hooks";

const actionHub = useActionHub();

// Register an action handler
actionHub.on("publish", (event) => {
  console.log("Published event:", event);
});

// Dispatch an action
actionHub.dispatch({ type: "publish", event });
```

---

## Code Patterns & Conventions

### Import Aliases

- `~/` maps to `./app/`

Example:
```typescript
import { fetchProfile } from "~/services/nostr";
import { Button } from "~/ui/button";
```

### Styling with Tailwind

Use the `cn()` utility for conditional classes:

```typescript
import { cn } from "~/lib/utils";

<div className={cn(
  "base-class",
  condition && "conditional-class",
  variant === "primary" && "primary-class"
)} />
```

### Component Patterns

#### Server Component (SSR)

```typescript
// routes/my-route.tsx
import type { Route } from "./+types/my-route";

export async function loader({ params }: Route.LoaderArgs) {
  const data = await fetchData(params.id);
  return { data };
}

export default function MyRoute({ loaderData }: Route.ComponentProps) {
  return <div>{loaderData.data.title}</div>;
}
```

#### Client Component

```typescript
// ui/my-component.client.tsx
import { useState } from "react";

export function MyComponent() {
  const [state, setState] = useState(0);

  return <button onClick={() => setState(s => s + 1)}>{state}</button>;
}
```

### Data Fetching Patterns

#### Server-Side (in loaders)

```typescript
import { dataStore } from "~/services/data.server";

export async function loader({ params }: Route.LoaderArgs) {
  const profile = await dataStore.fetchProfile({
    pubkey: params.pubkey,
    relays: INDEX_RELAYS
  });

  return { profile };
}
```

#### Client-Side (with React Query)

```typescript
import { useQuery } from "@tanstack/react-query";
import { fetchProfile } from "~/services/nostr";

export function ProfileCard({ pubkey }: { pubkey: string }) {
  const { data: profile } = useQuery({
    queryKey: ["profile", pubkey],
    queryFn: () => fetchProfile({ pubkey, relays: INDEX_RELAYS })
  });

  return <div>{profile?.name}</div>;
}
```

### Event Publishing Pattern

```typescript
import { usePublisher } from "applesauce-react/hooks";
import { useEventFactory } from "applesauce-react/hooks";
import { COMMON_RELAYS } from "~/const";

export function PublishButton() {
  const publisher = usePublisher();
  const factory = useEventFactory();

  async function handlePublish() {
    const event = factory.note("Hello Nostr!");
    await publisher.publish(event, COMMON_RELAYS);
  }

  return <button onClick={handlePublish}>Publish</button>;
}
```

### Draft Management Pattern

```typescript
import { saveDraft, loadDraft, deleteDraft } from "~/services/drafts.client";

// Auto-save on change
useEffect(() => {
  const timer = setTimeout(() => {
    saveDraft({ title, content });
  }, 1000);
  return () => clearTimeout(timer);
}, [title, content]);

// Load on mount
useEffect(() => {
  const draft = loadDraft();
  if (draft) {
    setTitle(draft.title);
    setContent(draft.content);
  }
}, []);

// Delete after publish
async function handlePublish() {
  await publish();
  deleteDraft();
}
```

---

## File Organization

### Routes (`app/routes/`)

Route files define URL patterns and their handlers:

- `home.tsx` - Homepage (`/`)
- `write.tsx` - Editor (`/write`)
- `address.tsx` - Nostr address viewer (`/a/:naddr`)
- `event.tsx` - Event viewer (`/e/:nevent`)
- `pubkey.tsx` - Profile viewer (`/p/:nprofile`)
- `username.tsx` - Username profile (`/:username`)
- `identifier.tsx` - Username article (`/:username/:identifier`)
- `hashtag.tsx` - Hashtag feed (`/t/:tag`)
- `relay.tsx` - Relay feed (`/relay/:relay`)
- `u/nip05.tsx` - NIP-05 profile (`/u/:nip05`)
- `u/article.tsx` - NIP-05 article (`/u/:nip05/:identifier`)

### Services (`app/services/`)

Business logic and data fetching:

- **`nostr.ts`** - Core Nostr protocol wrappers
- **`data.server.ts`** - Server-side data store with Redis caching
- **`data.client.ts`** - Client-side data store
- **`loaders.server.ts`** - Server-side data loaders
- **`loaders.client.ts`** - Client-side data loaders
- **`relay-pool.ts`** - WebSocket relay pool singleton
- **`event-store.ts`** - IndexedDB event cache
- **`publish-article.client.ts`** - Article publishing logic
- **`accounts.client.ts`** - Account management
- **`wallet.client.tsx`** - Wallet provider
- **`drafts.client.ts`** - Draft persistence

### UI Components (`app/ui/`)

#### Layouts
- `layouts/main.tsx` - Main layout (header, footer, navigation)
- `layouts/editor.tsx` - Editor layout (minimal chrome)

#### Nostr Components
- `nostr/article.tsx` - Article display
- `nostr/article-card.tsx` - Article card for lists
- `nostr/profile.tsx` - User profile
- `nostr/user-link.tsx` - User link with avatar
- `nostr/note.tsx` - Short note display
- `nostr/reply.client.tsx` - Comment/reply component
- `nostr/zap.client.tsx` - Lightning payment UI
- `nostr/rich-text.tsx` - Rich text rendering

#### Editor Components
- `editor/editor.client.tsx` - Main TipTap editor
- `editor/editor-toolbar.client.tsx` - Formatting toolbar
- `editor/editor-header.tsx` - Editor header
- `editor/publish-dialog.client.tsx` - Publish dialog
- `editor/extensions/` - Custom TipTap extensions

### Constants (`app/const.ts`)

Application-wide constants:

```typescript
export const kinds = {
  Metadata: 0,
  ShortNote: 1,
  LongFormArticle: 30023,
  Book: 30040,
  BookChapter: 30041,
  Comment: 1111,
  ZapReceipt: 9735,
  BlossomServerList: 10063,
};

export const INDEX_RELAYS = [
  "wss://purplepag.es",
  "wss://relay.nostr.band"
];
```

---

## Claude Skills

### Skill: nostr

**When to use:** Working with Nostr protocol, events, relays, or cryptographic operations.

**What it knows:**
- Nostr event structure and kinds
- Relay communication patterns
- NIP (Nostr Implementation Possibilities) specifications
- Cryptographic signing and verification
- Event filtering and subscriptions
- Pointer formats (naddr, nevent, nprofile)

**Common tasks:**
- Creating and signing Nostr events
- Fetching data from relays
- Parsing Nostr identifiers
- Implementing NIP specifications
- Debugging relay connections

**Key files to reference:**
- `/home/user/habla/app/services/nostr.ts` - Core Nostr functions
- `/home/user/habla/app/const.ts` - Event kinds and relay URLs
- `/home/user/habla/app/services/relay-pool.ts` - Relay management

**Example patterns:**

```typescript
// Fetch profile metadata
const profile = await fetchProfile({
  pubkey: "hex-pubkey",
  relays: INDEX_RELAYS
});

// Create and publish event
const factory = useEventFactory();
const event = factory.longFormArticle({
  title: "My Article",
  content: "Content here",
  identifier: "my-article"
});
await publisher.publish(event, relays);

// Subscribe to events
const subscription = pool.subscribe(relays, [
  { kinds: [30023], limit: 20 }
]);
```

---

### Skill: applesauce

**When to use:** Working with Applesauce libraries, data loading, or React integration.

**What it knows:**
- Applesauce package ecosystem
- Data loaders and caching strategies
- React hooks and providers
- Event store and IndexedDB integration
- Account and signer management
- Action system patterns

**Common tasks:**
- Using Applesauce hooks in components
- Setting up providers
- Creating data loaders
- Managing user accounts
- Publishing events with factories

**Key files to reference:**
- `/home/user/habla/app/entry.client.tsx` - Provider setup
- `/home/user/habla/app/services/loaders.client.ts` - Client loaders
- `/home/user/habla/app/services/loaders.server.ts` - Server loaders
- `/home/user/habla/app/services/accounts.client.ts` - Account management

**Example patterns:**

```typescript
// Use event store
const eventStore = useEventStore();
const event = await eventStore.getEvent(id);

// Use current account
const account = useCurrentAccount();
if (account) {
  console.log(account.pubkey);
}

// Create event with factory
const factory = useEventFactory();
const note = factory.note("Hello!");

// Publish with publisher
const publisher = usePublisher();
await publisher.publish(note, relays);

// Load profile with loader
const loader = createProfileLoader(pool, relays);
const profile = await loader(pubkey);
```

---

## Common Tasks

### Adding a New Route

1. **Create route file** in `app/routes/`

```typescript
// app/routes/my-new-route.tsx
import type { Route } from "./+types/my-new-route";

export async function loader({ params }: Route.LoaderArgs) {
  // Fetch data server-side
  return { data: "..." };
}

export default function MyNewRoute({ loaderData }: Route.ComponentProps) {
  return <div>{loaderData.data}</div>;
}
```

2. **Register route** in `app/routes.ts`

```typescript
import { type RouteConfig, route } from "@react-router/dev/routes";

export default [
  route("/my-new-route", "routes/my-new-route.tsx"),
  // ... other routes
] satisfies RouteConfig;
```

3. **Run typegen**

```bash
npm run typecheck
```

### Adding a New Nostr Event Kind

1. **Add constant** in `app/const.ts`

```typescript
export const kinds = {
  // ... existing kinds
  MyNewKind: 30024,
};
```

2. **Create loader** in `app/services/loaders.server.ts` or `loaders.client.ts`

```typescript
export async function fetchMyNewKind(pointer: AddressPointer) {
  return dataStore.fetchAddress({
    ...pointer,
    kind: kinds.MyNewKind
  });
}
```

3. **Add UI component** in `app/ui/nostr/`

```typescript
// app/ui/nostr/my-new-kind.tsx
export function MyNewKind({ event }: { event: NostrEvent }) {
  return <div>{event.content}</div>;
}
```

### Adding a UI Component

1. **Create component file** in `app/ui/`

```typescript
// app/ui/my-component.tsx
import { cn } from "~/lib/utils";

interface MyComponentProps {
  className?: string;
  children: React.ReactNode;
}

export function MyComponent({ className, children }: MyComponentProps) {
  return (
    <div className={cn("base-styles", className)}>
      {children}
    </div>
  );
}
```

2. **Use in routes or other components**

```typescript
import { MyComponent } from "~/ui/my-component";

<MyComponent>Content here</MyComponent>
```

### Adding Client-Side Interactivity

1. **Create `.client.tsx` file**

```typescript
// app/ui/my-interactive.client.tsx
import { useState } from "react";

export function MyInteractive() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(c => c + 1)}>
      Clicked {count} times
    </button>
  );
}
```

2. **Import with `.client` suffix**

```typescript
import { MyInteractive } from "~/ui/my-interactive.client";
```

### Fetching Nostr Data

#### Server-Side (in loader)

```typescript
import { dataStore } from "~/services/data.server";
import { INDEX_RELAYS } from "~/const";

export async function loader({ params }: Route.LoaderArgs) {
  const profile = await dataStore.fetchProfile({
    pubkey: params.pubkey,
    relays: INDEX_RELAYS
  });

  return { profile };
}
```

#### Client-Side (with React Query)

```typescript
import { useQuery } from "@tanstack/react-query";
import { fetchEvent } from "~/services/nostr";

export function EventDisplay({ id }: { id: string }) {
  const { data: event } = useQuery({
    queryKey: ["event", id],
    queryFn: () => fetchEvent({ id, relays: INDEX_RELAYS })
  });

  if (!event) return <div>Loading...</div>;
  return <div>{event.content}</div>;
}
```

### Publishing Events

```typescript
import { usePublisher } from "applesauce-react/hooks";
import { useEventFactory } from "applesauce-react/hooks";
import { COMMON_RELAYS } from "~/const";
import { toast } from "sonner";

export function PublishArticle({ title, content }) {
  const publisher = usePublisher();
  const factory = useEventFactory();

  async function handlePublish() {
    try {
      const article = factory.longFormArticle({
        title,
        content,
        identifier: slugify(title)
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

### Working with TipTap Editor

```typescript
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";

export function MyEditor() {
  const editor = useEditor({
    extensions: [StarterKit, Link],
    content: "<p>Initial content</p>",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      console.log(html);
    }
  });

  return <EditorContent editor={editor} />;
}
```

---

## Best Practices

### Security

1. **Never log or expose private keys**
   - Use environment variables for sensitive data
   - Validate all user input
   - Sanitize HTML from untrusted sources

2. **Validate Nostr signatures**
   - Always verify event signatures before trusting data
   - Use `nostr-tools` for cryptographic operations

3. **Prevent XSS attacks**
   - Sanitize user-generated content before rendering
   - Use React's built-in XSS protection
   - Be careful with `dangerouslySetInnerHTML`

### Performance

1. **Optimize relay connections**
   - Reuse relay pool singleton
   - Close subscriptions when components unmount
   - Batch requests when possible

2. **Cache aggressively**
   - Use IndexedDB for event caching
   - Leverage Redis on server-side
   - Enable React Query caching

3. **Code splitting**
   - Use `.client.tsx` for browser-only code
   - Lazy load heavy components
   - Prerender critical pages

### Code Quality

1. **Type safety**
   - Use TypeScript strict mode
   - Run `npm run typecheck` before commits
   - Define interfaces for all data structures

2. **Consistent patterns**
   - Follow existing component patterns
   - Use `cn()` for conditional classes
   - Keep components small and focused

3. **Error handling**
   - Always handle async errors
   - Show user-friendly error messages
   - Log errors for debugging

---

## TODOs and Improvements

Current items tracked in the codebase:

- [ ] Load fonts locally instead of Google Fonts
- [ ] Implement dynamic language support (i18n)
- [ ] Add translatable error messages
- [ ] Better 404/500 error pages
- [ ] Prettier and ESLint setup
- [ ] Deployment configuration documentation
- [ ] Add testing framework (Vitest, Playwright)
- [ ] Editor skeleton loading state

---

## Additional Resources

### Nostr Resources

- [Nostr Protocol Specification](https://github.com/nostr-protocol/nostr)
- [NIPs Repository](https://github.com/nostr-protocol/nips)
- [nostr-tools Documentation](https://github.com/nbd-wtf/nostr-tools)

### Applesauce Resources

- Check package README files in `node_modules/applesauce-*`
- TypeScript types provide inline documentation

### React Router v7

- [React Router v7 Docs](https://reactrouter.com)
- [React Router v7 Migration Guide](https://reactrouter.com/start/framework/migration)

### TipTap

- [TipTap Documentation](https://tiptap.dev)
- [TipTap React Guide](https://tiptap.dev/docs/editor/getting-started/install/react)

---

## Quick Reference

### Environment Setup

```bash
# Install dependencies
npm install

# Start development
npm run dev

# Type check
npm run typecheck

# Build production
npm run build

# Start production
npm run start
```

### Key Directories

| Directory | Purpose |
|-----------|---------|
| `app/routes/` | Route handlers and pages |
| `app/services/` | Business logic and data |
| `app/ui/` | React components |
| `app/lib/` | Utility functions |
| `app/hooks/` | Custom React hooks |
| `public/` | Static assets |

### Key Concepts

| Term | Definition |
|------|------------|
| **Nostr** | Decentralized social protocol |
| **Relay** | WebSocket server storing events |
| **Event** | Signed JSON data structure |
| **NIP** | Nostr Implementation Possibility |
| **npub** | Nostr public key (bech32) |
| **nsec** | Nostr secret key (bech32) |
| **naddr** | Address pointer |
| **nevent** | Event pointer |
| **nprofile** | Profile pointer |

---

**Last Updated:** 2025-12-28
