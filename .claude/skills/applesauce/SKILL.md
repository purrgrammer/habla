---
name: applesauce
description: Working with the applesauce nostr libraries (v6) in this repo — EventStore, loaders, RelayPool, models, helpers, actions, accounts and signers. Use when reading or writing any code that imports applesauce-core, applesauce-common, applesauce-loaders, applesauce-relay, applesauce-react, applesauce-factory, applesauce-actions, applesauce-accounts or applesauce-signers; when fetching nostr events, profiles, timelines or zaps; or when adding a publish/comment/zap flow.
---

# applesauce v6 in Habla

Habla is a static SPA. Every applesauce call runs in the browser — there is no
server half. Ten packages, one rule: **the `EventStore` is the only source of
truth, and everything else either fills it or reads from it.**

## Which package has what

v6 split the old monolithic `applesauce-core` in two. Getting this wrong is the
single most common error, because the imports look identical.

| Import from                  | What lives there                                                                                                                                                                |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `applesauce-core`            | `EventStore`, `EventSigner`                                                                                                                                                     |
| `applesauce-core/helpers`    | Generic event plumbing: `getTagValue`, `getProfileContent`, `getReplaceableAddress`, `getAddressPointerForEvent`, `getInboxes`, `isReplaceable`, `safeParse`, `getRelayURLs`    |
| `applesauce-common/helpers`  | Kind-specific helpers: `getArticleTitle`/`Summary`/`Image`/`Published`, `getHighlight*`, `getZapSender`/`Request`/`Payment`, `parseBolt11`, `parseLNURLOrAddress`, `getInvoice` |
| `applesauce-common/models`   | `EventZapsModel`, thread/comment/bookmark/reaction models                                                                                                                       |
| `applesauce-core/models`     | `ProfileModel` and the other generic models                                                                                                                                     |
| `applesauce-loaders/loaders` | `createAddressLoader`, `createEventLoader`, `createTimelineLoader`, `createZapsLoader`                                                                                          |
| `applesauce-relay`           | `RelayPool`                                                                                                                                                                     |
| `applesauce-react/hooks`     | `useEventStore`, `useObservableMemo`, `useActiveAccount`, `useAccountManager`, `useActionRunner`                                                                                |
| `applesauce-factory`         | `EventFactory` and the tag/content operations                                                                                                                                   |
| `applesauce-actions`         | `ActionRunner`, `Action`, `ActionContext`                                                                                                                                       |

If an import errors with "has no exported member", try the other of
`applesauce-core/helpers` ↔ `applesauce-common/helpers` before anything else.

## Reading events

Two halves, always both: **subscribe to the store** for reactive reads, and
**kick a loader** to fill it. The store never fetches on its own.

```ts
export function useEvent(pointer: EventPointer) {
  const eventStore = useEventStore();

  // Reactive read — re-renders when the event lands, whoever put it there.
  const event = useObservableMemo(
    () => eventStore.event(pointer.id),
    [pointer],
  );

  // Fetch — the loader writes into the same store.
  useEffect(() => {
    const sub = eventLoader(pointer).subscribe();
    return () => sub.unsubscribe();
  }, [pointer]);

  return event;
}
```

The hooks in `app/hooks/nostr.ts` (`useProfile`, `useEvent`, `useAddress`,
`useRelays`, `useTimeline`, `useZaps`) already follow this shape. Reach for one
before writing a new loader call.

Loaders are configured once in `app/services/loaders.ts`. `profileLoader`
batches (`bufferTime: 50`, `bufferSize: 100`), so calling it per-avatar in a
list is fine and intended.

## Talking to relays directly

`RelayPool` has three methods that look alike and are not:

```ts
pool.request(relays, filters); // Observable<NostrEvent>, completes on EOSE
pool.subscription(relays, filters); // Observable<NostrEvent>, stays open
pool.req(relays, filters); // Observable<GroupReqMessage> — raw, rarely what you want
```

Use `request()` for "fetch what exists", `subscription()` for a live feed. Both
emit `NostrEvent` only — v6 no longer inlines `"EOSE"` into the stream, so
`if (ev === "EOSE") return` guards are dead code, and `completeOnEose()` is no
longer needed after `request()`.

Signer classes take `subscription`/`publish` methods; wire them with
`pool.subscription`, not `pool.req` (see `app/services/accounts.ts`).

## Helpers cache themselves

Helpers memoise onto the event with a symbol. **Do not wrap them in
`useMemo`** — it adds a dependency array to get wrong for no gain.

```ts
const title = getArticleTitle(article); // already cached on `article`
```

## Helpers that can return null

v6 made several helpers honest about failing. The ones that bite here:

- `getReplaceableAddress(event)` → `null` for a non-addressable event
- `getAddressPointerForEvent(event)` → `null` likewise
- `getZapSender(receipt)` → `undefined` if the receipt has no zap request

`app/lib/event.ts` collapses the two cases the UI actually wants:
`addressOrId(event)` and `displayPubkey(event)`. Use those rather than
re-deriving the fallback at each call site.

## Writing events

An **action** is a plain async function over an `ActionContext`. v6 replaced
the old async-generator-that-yields-events form:

```ts
export function Comment({
  event,
  message,
}: {
  event: NostrEvent;
  message: string;
}): Action {
  return async ({ events, self, sign, publish }) => {
    const draft = await factory.build(
      { kind: COMMENT, content: message },
      modifyPublicTags(
        addPubkeyTag({ pubkey: event.pubkey }),
        addEventTag(event),
      ),
    );
    await publish(await sign(draft));
  };
}
```

The context gives you `events` (the store), `self` (signer pubkey), `user`,
`sign`, `publish` and `run`. It has **no `factory`** — import the singleton
from `~/services/event-factory`.

Run actions through the shared `ActionRunner` (`~/services/action-hub`):

```ts
const runner = useActionRunner();

// exec() returns the signed events instead of publishing them, so the UI can
// publish with per-relay progress. That is the pattern this app uses.
const signed = await firstValueFrom(runner.exec(Comment, { event, message }));
```

`runner.run()` would publish through the runner's own publish method — this app
does not configure one on purpose.

## Providers

`app/ui/providers.tsx` wires `EventStoreProvider`, `AccountsProvider` and
`ActionsProvider`. Note `ActionsProvider` takes `runner`, and there is no
`FactoryProvider` in v6 — components import the factory singleton.

## Gotchas

- `applesauce-factory` is versioned independently (v4 while the rest are v6).
  Do not "fix" it to `^6`.
- `applesauce-common` is a real dependency of this app, not just a transitive
  one. Keep it in `package.json`.
- Everything applesauce here is client-only. Anything that touches
  `EventStore`, the pool or an account must not run during the build's
  `index.html` render — put it behind `~/ui/client-only` if in doubt.

## Reference

- Longer notes: `claudedocs/applesauce-guide.md`
- Upstream docs: https://hzrd149.github.io/applesauce/
