# Claude Code Documentation

Habla is a **nostr long-form writing platform**: read, highlight, write, publish
and zap articles that live on relays. It ships as a **static single-page app**
with no backend, deployable to any static host or to nostr itself as an
[nsite](https://nsite.run).

## Quick Start

```bash
pnpm dev          # http://localhost:5173
pnpm build        # gen:static + build to build/client
pnpm preview      # serve the build with SPA fallback on :4173
pnpm typecheck    # route typegen + tsc
pnpm test         # vitest
```

## Verification Requirement

**Before marking any task complete:**

```bash
pnpm build && pnpm typecheck
```

## There Is No Server

This is the single most important thing to know, because a lot of React Router
material assumes otherwise.

- `react-router.config.ts` sets `ssr: false`. The build is `build/client`:
  static files only.
- Routes export **`clientLoader`**, never `loader`. A `loader`, `action` or
  `headers` export in a non-root route is a build error.
- `meta()` still works but runs in the browser, so it sets `document.title` and
  tags after hydration. Crawlers that do not run JS see the generic shell.
- `app/entry.server.tsx` exists only to render `index.html` at build time. It
  never runs in production.
- There is no Redis, no `/api/*`, no `.server.ts` modules. If you find yourself
  writing one, you have taken a wrong turn.

`.well-known/nostr.json` and `sitemap.xml` are generated into `public/` from
`app/members.ts` by `pnpm gen:static` (which `pnpm build` runs first).

## Tech Stack

- React Router v7 (framework mode, SPA)
- applesauce v6 (nostr client libraries) — see the **applesauce skill**
- TipTap v3 (editor, serializes to Markdown)
- Tailwind v4 + Radix UI
- TanStack Query v5, RxJS

`~/` is the import alias for `./app/`.

## Data Flow

One path, all in the browser:

```
route clientLoader ──> ~/services/data ──> loaders ──> relays
                                              │
                                              ▼
                                         EventStore ──> hooks ──> components
```

**`app/services/data.ts`** is the route-level store (`DataStore` in
`services/types.ts`): `getMembers`, `fetchRelays`, `fetchProfile`, `fetchEvent`,
`fetchAddress`. Every call has a `CLIENT_TIMEOUT` ceiling and resolves to
`undefined` rather than hanging or throwing, so a route falls back to its
skeleton instead of spinning forever.

**`EventStore`** (`app/services/event-store.ts`) is the source of truth for
events. Components read it reactively; loaders fill it. Never fetch straight
into component state.

A typical route:

```tsx
type LoadArgs = Pick<Route.ClientLoaderArgs, "params">;

async function loadData(store: DataStore, { params }: LoadArgs) {
  /* ... */
}

export async function clientLoader(args: Route.ClientLoaderArgs) {
  return loadData(store, args);
}

export default function Page({ loaderData }: Route.ComponentProps) {
  return loaderData ? <Article {...loaderData} /> : <CardSkeleton />;
}
```

`clientLoader` blocks the route's first paint, so keep it to the one or two
fetches the page cannot render without. Anything per-item — an author's avatar,
a zap total — belongs in a hook inside the component, where it streams in.

## Key Hooks (`app/hooks/nostr.ts`)

| Hook                                           | Purpose                               |
| ---------------------------------------------- | ------------------------------------- |
| `useProfile(pubkey)`                           | Profile, live                         |
| `useEvent(pointer)`                            | Event by `EventPointer`               |
| `useAddress(pointer)`                          | Replaceable event by `AddressPointer` |
| `useRelays(pubkey)` / `useInboxRelays(pubkey)` | Relay lists                           |
| `useTimeline(id, filters, relays)`             | Timeline, live                        |
| `useZaps(event)`                               | Zaps with realtime updates            |

## Members

`app/members.ts` is the NIP-05 registry — the `username -> pubkey` map behind
`habla.news/<username>`. To add someone: append to `MEMBERS`, run
`pnpm gen:static`, commit the regenerated files in `public/`.

`MEMBER_NAMES`, `findMember(username)` and `memberFor(pubkey)` are the accessors;
`useMembers()` in `app/nostr/queries.ts` exposes the list to components.

## Constants (`app/const.ts`)

```
INDEX_RELAYS       purplepag.es, vertexlab.io — profile and relay-list lookups
AGGREGATOR_RELAYS  damus.io, nos.lol, primal.net — content
COMMENT            1111
BOOK / BOOK_CHAPTER 30040 / 30041
```

## Project Structure

```
app/
├── routes/       # One file per URL: clientLoader + meta + component
├── services/     # data, loaders, relay-pool, event-store, accounts,
│                 # action-hub, event-factory, wallet, drafts, blossom
├── nostr/        # actions.ts (publish/comment/zap), publish-article.ts, queries.ts
├── ui/           # Components; ui/nostr/* is the nostr-aware layer
├── hooks/nostr.ts
├── lib/          # event.ts, url.ts, markdown-serializer.ts, utils.ts, http.ts
├── members.ts    # NIP-05 registry
├── featured.ts   # Home-page articles and highlights, hardcoded
└── const.ts
scripts/gen-static.ts   # writes public/.well-known/nostr.json + sitemap.xml
.nsite/config.json      # nsyte deploy target
```

## Conventions

- `.client.tsx` is still used for browser-only components, but note that in SPA
  mode _everything_ is browser-only. Reach for `~/ui/client-only` when a
  component must not run during the build's `index.html` render.
- Style with `cn()` from `~/lib/utils`.
- Errors surface through `toast` from `sonner`.
- Applesauce helpers cache internally — no `useMemo` around them.

## Documentation Index

- **applesauce v6** → the `applesauce` skill in `.claude/skills/`
- **Nostr protocol** → `claudedocs/nostr-guide.md`
- **Implementation recipes** → `claudedocs/common-tasks.md`
