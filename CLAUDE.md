# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Development Server:**

```bash
npm run dev
```

- Starts React Router dev server with HMR
- Available at http://localhost:5173

**Build:**

```bash
npm run build
```

- Creates production build using React Router
- Outputs to `build/` directory with client and server assets

**Type Checking:**

```bash
npm run typecheck
```

- Runs React Router type generation and TypeScript compiler
- Must be run after making route changes

**Start Production:**

```bash
npm run start
```

- Serves the built application

## Architecture Overview

This is a **Nostr-based social media application** built with React Router v7. Nostr (Notes and Other Stuff Transmitted by Relays) is a decentralized protocol for social networking.

### Key Technologies

- **React Router v7** - Full-stack React framework with SSR
- **Nostr Protocol** - Decentralized social media protocol
- **Applesauce** - Nostr client library suite (core, loaders, relay, etc.)
- **TailwindCSS v4** - Styling with Vite integration
- **TipTap** - Rich text editor for article creation
- **Radix UI** - UI component primitives

### Application Structure

**Core Nostr Services** (`app/services/`):

- `nostr.ts/client.ts/server.ts` - Main Nostr protocol interactions
- `loaders.client.ts/server.ts` - Data loading utilities for profiles, events, articles
- `relay-pool.ts` - WebSocket connection management to Nostr relays
- `event-store.ts` - Local event caching and management

**Route Architecture** (`app/routes/`):

- Two main layouts: `editor.tsx` (for writing) and `main.tsx` (for reading)
- Nostr entity routes: `/a/:naddr` (addresses), `/e/:nevent` (events), `/p/:nprofile` (profiles)
- User content: `/u/:nip05` (user profiles), `/u/:nip05/:identifier` (articles)
- Content discovery: `/t/:tag` (hashtags), `/relay/:relay` (relay feeds)
- Username routing: `:username` and `:username/:identifier` for human-readable URLs

**UI Components** (`app/ui/`):

- `nostr/` - Nostr-specific components (profiles, notes, articles, rich text)
- General UI components built on Radix primitives
- Client-side components marked with `.client.tsx`

### Nostr Concepts

- **Events** - All data is stored as signed events with kinds (0=profile, 1=note, 30023=article)
- **Relays** - WebSocket servers that store and distribute events
- **Keys** - Cryptographic identities (pubkey/privkey pairs)
- **NIPs** - Nostr Implementation Possibilities (protocol specifications)
- **NIP-05** - DNS-based verification system for human-readable names

### Featured Content System

The `app/featured.ts` file contains hardcoded featured users and articles for homepage display and prerendering.

### Prerendering

React Router config includes prerendering logic that:

- Generates static pages for featured users and their articles
- Creates SEO-friendly URLs based on NIP-05 identifiers
- Handles `.well-known/nostr.json` for NIP-05 verification

## Key Development Patterns

**Client/Server Separation:**

- `.client.tsx` files run only in browser
- `.server.ts` files run only on server
- Regular files run in both environments

**Nostr Data Loading:**

- Use `applesauce-loaders` for consistent data fetching
- Server-side loaders in `~/services/loaders.server`
- Client-side loaders in `~/services/loaders.client`

**Route Structure:**

- All routes defined in `app/routes.ts`
- Use typed route imports from `+types/` directories
- Layout nesting with main and editor layouts

## Path Aliases

- `~/` maps to `./app/`

## TODOs in Codebase

- Load fonts locally instead of from Google Fonts
- Implement dynamic language support
- Add i18n for error messages
- Prettier and ESLint setup needed
- Deployment configuration
- Better 404/500 error pages
