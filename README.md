# Habla

Long-form writing on [nostr](https://nostr.com). Read, highlight, write and
publish articles that live on relays instead of on someone's server — and get
paid for them in bitcoin over lightning.

Habla is a **static single-page app**. There is no backend: the browser talks
to nostr relays directly, signs with the reader's own key, and stores drafts
locally. The whole thing is a folder of files you can host anywhere, including
on nostr itself as an [nsite](https://nsite.run).

## What it does

- **Read** long-form articles (NIP-23, kind `30023`) from any relay, by author,
  by hashtag, or by relay.
- **Write and publish** with a rich-text editor that round-trips Markdown, with
  drafts saved to `localStorage` and images uploaded to
  [Blossom](https://github.com/hzrd149/blossom) servers.
- **Highlight** passages (kind `9802`) and comment on them (NIP-22).
- **Zap** authors over lightning, with a built-in NWC wallet.
- **Named URLs**: members in `app/members.ts` get `habla.news/<name>` and
  `habla.news/<name>/<article>`, backed by a static NIP-05 file.

## Running it

Requires Node 20+ and pnpm.

```bash
pnpm install
pnpm dev          # http://localhost:5173
```

Other scripts:

| Command             | What it does                                                      |
| ------------------- | ----------------------------------------------------------------- |
| `pnpm build`        | Regenerates static files, then builds to `build/client`           |
| `pnpm preview`      | Serves the built site with SPA fallback on `:4173`                |
| `pnpm typecheck`    | Route typegen + `tsc`                                             |
| `pnpm test`         | Vitest                                                            |
| `pnpm gen:static`   | Rewrites `public/.well-known/nostr.json` and `public/sitemap.xml` |
| `pnpm deploy:nsite` | Builds and publishes to nostr with `nsyte`                        |

There are no required environment variables. `SITE_URL` (default
`https://habla.news`) only affects the absolute URLs in the generated sitemap.

## Deploying

`pnpm build` produces `build/client`: plain HTML, JS, CSS and assets. Serve it
from anything, with two requirements:

- **Unknown paths must fall back to `/index.html`**, or client-side routes like
  `/verbiricha/grimoire` will 404.
- **`/.well-known/nostr.json` must be served with
  `Access-Control-Allow-Origin: *`.** Other nostr web clients fetch it
  cross-origin to verify `<name>@habla.news`, and without the header every
  member's NIP-05 badge fails elsewhere. This used to be a response header set
  by the server route; on a static host it is host configuration.

### As an nsite

[nsyte](https://github.com/sandwichfarm/nsyte) uploads the build to Blossom
servers and publishes the file map to relays, so the site is addressed by a
nostr pubkey rather than a domain. The relays, Blossom servers and the
`/index.html` fallback live in `.nsite/config.json` — review them before your
first deploy.

nsyte is a Deno CLI, not an npm package:

```bash
deno install -Afg jsr:@nsyte/cli   # once
pnpm deploy:nsite
```

nsite gateways serve `.well-known` and the SPA fallback for you.

### Anywhere else

Any static host works — Vercel, Netlify, Cloudflare Pages, S3, nginx — as long
as you configure the SPA fallback.

## Adding a member

Members get a vanity URL and a NIP-05 identity at `habla.news`.

1. Add `{ username, pubkey }` to `app/members.ts`.
2. Run `pnpm gen:static` and commit the regenerated
   `public/.well-known/nostr.json` and `public/sitemap.xml`.
3. Deploy.

## How it's built

- **[React Router v7](https://reactrouter.com)** in framework mode with
  `ssr: false`. Routes still get `meta()`, layouts and typed params; data comes
  from `clientLoader` instead of a server `loader`.
- **[applesauce](https://github.com/hzrd149/applesauce) v6** for everything
  nostr: `EventStore` as the single source of truth, loaders that batch and
  deduplicate relay requests, and RxJS observables for reactive updates.
- **[TipTap v3](https://tiptap.dev)** for the editor, serializing to Markdown.
- **Tailwind v4** and **Radix UI** for the interface.

```
app/
├── routes/      # One file per URL; clientLoader + component
├── services/    # Relay pool, event store, loaders, accounts, wallet, drafts
├── nostr/       # Actions (publish, comment, zap request) and queries
├── ui/          # Components; ui/nostr/* is the nostr-aware layer
├── hooks/       # useProfile, useEvent, useTimeline, useZaps, ...
├── members.ts   # The NIP-05 registry
└── featured.ts  # Articles and highlights baked into the home page
```

For the longer version, see `CLAUDE.md` and `claudedocs/`.

## Tradeoffs worth knowing

Dropping the server bought simplicity and censorship resistance, and cost two
things:

- **No server-rendered meta tags.** `meta()` runs in the browser, so crawlers
  and chat previews that do not execute JavaScript see the generic site title
  rather than the article's.
- **First paint waits on relays.** There is no cache in front of the network;
  a page shows its skeleton until the events arrive.

## License

See [LICENSE](./LICENSE).
