# Claude Code Documentation

Habla is a **nostr long-form writing platform**: read, highlight, write, publish
and zap articles that live on relays. It ships as a **static single-page app**
with no backend, deployable to any static host or to nostr itself as an
[nsite](https://nsite.run).

## Quick Start

```bash
pnpm dev          # http://localhost:5173
pnpm build        # static build to build/client
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
- No canonical URLs or absolute links. The app does not know what host it is
  served from; use `window.location.origin` if you need one at runtime.
- `meta()` still works but runs in the browser, so it sets `document.title` and
  tags after hydration. Crawlers that do not run JS see the generic shell.
- `app/entry.server.tsx` exists only to render `index.html` at build time. It
  never runs in production.
- There is no Redis, no `/api/*`, no `.server.ts` modules. If you find yourself
  writing one, you have taken a wrong turn.

There are also no NIP-05 handles. Habla has no domain of its own, so it issues
no `<name>@habla.news` addresses and no `habla.news/<name>` pages. Everything is
addressed by nostr identifier: `/a/<naddr>`, `/p/<nprofile>`, `/e/<nevent>`.
An author's _own_ NIP-05 (from their kind-0) is still displayed and verified —
that identity belongs to them, not to us.

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
`services/types.ts`): `fetchRelays`, `fetchProfile`, `fetchEvent`,
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

## Constants (`app/const.ts`)

```
INDEX_RELAYS       purplepag.es, user.kindpag.es, indexer.coracle.social,
                   vertexlab.io — kinds 0/10002/10063, asked before content
                   relays because routing them by NIP-65 would be circular
AGGREGATOR_RELAYS  damus.io, nos.lol, primal.net — content, and the last-resort
                   tier for a pubkey the indexers have never seen
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
├── lib/          # event.ts, url.ts, markdown-serializer.ts, utils.ts
├── featured.ts   # Home-page articles, highlights and authors, hardcoded
└── const.ts
.nsite/config.json  # nsyte deploy target
```

Two fields in `.nsite/config.json` are decisions rather than settings:

- **`fallback: "/index.html"`** — without it every URL past `/` is a gateway
  404. An nsite serves what its manifest lists, and every Habla address below
  the root (`/a/<naddr>`, `/p/<nprofile>`, `/e/<nevent>`) is a client route
  that only exists once the app has booted.
- **`publishAppHandler: false`** — a NIP-89 handler needs a URL, and the site
  has none until the signing key and the gateway are known. The `appHandler`
  block names the kinds (30023, 30024) and waits for that host.

## Conventions

- In SPA mode _everything_ is browser-only, so `~/ui/client-only` is needed in
  exactly one place: inside `root.tsx`, the only route rendered during the
  build's `index.html` pass. Do not reintroduce it elsewhere.
- Style with `cn()` from `~/lib/utils`.
- Errors surface through `toast` from `sonner`.
- Applesauce helpers cache internally — no `useMemo` around them.

## Documentation Index

- **applesauce v6** → the `applesauce` skill in `.claude/skills/`
- **Nostr protocol** → `claudedocs/nostr-guide.md`
- **Implementation recipes** → `claudedocs/common-tasks.md`
