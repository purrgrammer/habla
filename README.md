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
  by hashtag, or by relay. Everything is addressed by nostr identifier —
  `/a/<naddr>` for an article, `/p/<nprofile>` for an author — so no copy of
  Habla depends on owning a domain.
- **Write and publish** with a rich-text editor that round-trips Markdown, with
  drafts saved to `localStorage` and images uploaded to
  [Blossom](https://github.com/hzrd149/blossom) servers.
- **Highlight** passages (kind `9802`) and comment on them (NIP-22).
- **Zap** authors over lightning, with a built-in NWC wallet.

## Running it

Requires Node 20+ and pnpm.

```bash
pnpm install
pnpm dev          # http://localhost:5173
```

Other scripts:

| Command             | What it does                                       |
| ------------------- | -------------------------------------------------- |
| `pnpm build`        | Builds to `build/client`                           |
| `pnpm preview`      | Serves the built site with SPA fallback on `:4173` |
| `pnpm typecheck`    | Route typegen + `tsc`                              |
| `pnpm test`         | Vitest                                             |
| `pnpm deploy:nsite` | Builds and publishes to nostr with `nsyte`         |

There are no environment variables.

## Deploying

`pnpm build` produces `build/client`: plain HTML, JS, CSS and assets. Serve it
from anything, with one requirement — **unknown paths must fall back to
`/index.html`**, or a link like `/a/naddr1...` will 404 instead of booting the
app.

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

nsite gateways handle the SPA fallback for you.

### Anywhere else

Any static host works — Vercel, Netlify, Cloudflare Pages, S3, nginx — as long
as you configure the SPA fallback.

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
└── featured.ts  # Featured articles, highlights and authors, baked in
```

For the longer version, see `CLAUDE.md` and `claudedocs/`.

## Tradeoffs worth knowing

Dropping the server bought simplicity and censorship resistance, and cost two
things:

- **No server-rendered meta tags.** `meta()` runs in the browser, so crawlers
  and chat previews that do not execute JavaScript see the generic site title
  rather than the article's. There is no sitemap either — the URLs are nostr
  identifiers, not a list anyone could enumerate ahead of time.
- **First paint waits on relays.** There is no cache in front of the network;
  a page shows its skeleton until the events arrive.

## License

See [LICENSE](./LICENSE).
