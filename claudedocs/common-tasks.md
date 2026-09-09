# Common Tasks Reference

Step-by-step guides for common development tasks in Habla.

## Adding a New Route

1. Register the URL in `app/routes.ts`.
2. Create `app/routes/<name>.tsx` with a `clientLoader`, a `meta()` and a
   component. There is no server, so there is no `loader`.

```tsx
import type { Route } from "./+types/name";
import { default as store } from "~/services/data";
import type { DataStore } from "~/services/types";
import defaults from "~/seo";

type LoadArgs = Pick<Route.ClientLoaderArgs, "params">;

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return defaults;
  return [{ title: loaderData.title }];
}

async function loadData(store: DataStore, { params }: LoadArgs) {
  /* fetch only what the page cannot render without */
}

export async function clientLoader(args: Route.ClientLoaderArgs) {
  return loadData(store, args);
}

export default function Name({ loaderData }: Route.ComponentProps) {
  if (!loaderData) return <Skeleton />;
  return <div>{/* ... */}</div>;
}
```

3. `pnpm typecheck` to regenerate `./+types/name`.

`clientLoader` blocks first paint. Per-item data — an author's profile, a zap
total — belongs in a hook inside the component instead, so it streams in.

## Adding a UI Component

1. **Create component file** in `app/ui/`

```typescript
// app/ui/my-component.tsx
import { cn } from "~/lib/utils";

interface MyComponentProps {
  className?: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}

export function MyComponent({
  className,
  children,
  variant = "primary"
}: MyComponentProps) {
  return (
    <div className={cn(
      "base-styles",
      variant === "primary" && "primary-styles",
      variant === "secondary" && "secondary-styles",
      className
    )}>
      {children}
    </div>
  );
}
```

2. **Use in routes or other components**

```typescript
import { MyComponent } from "~/ui/my-component";

<MyComponent variant="secondary">Content</MyComponent>
```

## Adding Client-Side Interactivity

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

2. **Import with `.client` suffix in parent component**

```typescript
import { MyInteractive } from "~/ui/my-interactive.client";

export default function MyRoute() {
  return <MyInteractive />;
}
```

## Fetching Nostr Data

### In a route (blocking, for the page's own subject)

```tsx
import { default as store } from "~/services/data";

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const profile = await store.fetchProfile({ pubkey: params.pubkey });
  return { profile };
}
```

Every `DataStore` method has a timeout and resolves to `undefined` rather than
throwing, so the route falls back to its skeleton on a slow relay.

### In a component (streaming, for everything else)

```tsx
import { useProfile, useTimeline } from "~/hooks/nostr";

function AuthorLine({ pubkey }: { pubkey: string }) {
  const profile = useProfile(pubkey); // undefined until it arrives, then re-renders
  return <span>{profile?.display_name ?? pubkey.slice(0, 8)}</span>;
}
```

These hooks subscribe to the `EventStore` and trigger a loader; see the
`applesauce` skill for the pattern behind them.

## Publishing Events

Publishing goes through an **action** run by the shared `ActionRunner`. Actions
live in `app/nostr/actions.ts`.

### Define the action

```ts
import type { Action } from "applesauce-actions";
import factory from "~/services/event-factory";
import { modifyPublicTags } from "applesauce-factory/operations";
import { addPubkeyTag } from "applesauce-factory/operations/tag";

export function Note({ message }: { message: string }): Action {
  return async ({ sign, publish }) => {
    const draft = await factory.build({
      kind: kinds.ShortTextNote,
      content: message,
    });
    await publish(await sign(draft));
  };
}
```

The context has `events`, `self`, `user`, `sign`, `publish` and `run` — but no
`factory`; import the singleton.

### Run it and publish

`runner.exec()` hands back the signed events instead of sending them, which is
what lets the UI report per-relay progress.

```tsx
const runner = useActionRunner();

const signed = await firstValueFrom(runner.exec(Note, { message }));
const result = await publishToRelays(signed, relays, (progress) => {
  progress.statuses
    .filter((s) => s.status === "error")
    .forEach((s) =>
      toast.error(`Failed to publish to ${s.relay}`, {
        description: s.message,
      }),
    );
});
if (result.successCount === 0)
  throw new Error("Failed to publish to any relay");
```

For articles specifically, use the existing `PublishArticle` action rather than
building a kind 30023 by hand — it handles `d`, `published_at`, imeta tags,
mentions and tag deduplication.

## Working with TipTap Editor

### Basic Setup

```typescript
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";

export function MyEditor() {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      })
    ],
    content: "<p>Initial content</p>",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      console.log("Content changed:", html);
    }
  });

  if (!editor) return null;

  return <EditorContent editor={editor} />;
}
```

### Add Custom Toolbar

```typescript
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

export function EditorWithToolbar() {
  const editor = useEditor({
    extensions: [StarterKit],
    content: "<p>Hello world</p>"
  });

  if (!editor) return null;

  return (
    <div>
      <div className="toolbar">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "active" : ""}
        >
          Bold
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive("italic") ? "active" : ""}
        >
          Italic
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive("heading", { level: 1 }) ? "active" : ""}
        >
          H1
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
```

## Adding a Nostr Event Kind

1. **Add constant** in `app/const.ts`

```typescript
export const kinds = {
  // ... existing kinds
  MyCustomKind: 30024,
};
```

2. **Create loader** (if needed)

```typescript
// In app/services/loaders.ts
export async function fetchMyCustomKind(pointer: AddressPointer) {
  return dataStore.fetchAddress({
    ...pointer,
    kind: kinds.MyCustomKind,
  });
}
```

3. **Add UI component** in `app/ui/nostr/`

```typescript
// app/ui/nostr/my-custom-kind.tsx
import type { NostrEvent } from "applesauce-core";

export function MyCustomKind({ event }: { event: NostrEvent }) {
  return (
    <article>
      <h1>{event.tags.find(t => t[0] === "title")?.[1]}</h1>
      <div>{event.content}</div>
    </article>
  );
}
```

## Managing Drafts

### Save Draft

```typescript
import { saveDraft } from "~/services/drafts.client";

function AutoSaveDraft({ title, content }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      saveDraft({ title, content });
    }, 1000); // Debounce 1 second

    return () => clearTimeout(timer);
  }, [title, content]);
}
```

### Load Draft

```typescript
import { loadDraft } from "~/services/drafts.client";

function EditorWithDraft() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      setTitle(draft.title || "");
      setContent(draft.content || "");
    }
  }, []);

  return (
    <div>
      <input value={title} onChange={e => setTitle(e.target.value)} />
      <textarea value={content} onChange={e => setContent(e.target.value)} />
    </div>
  );
}
```

### Delete Draft

```typescript
import { deleteDraft } from "~/services/drafts.client";

async function handlePublish() {
  await publishArticle();
  deleteDraft(); // Clear draft after successful publish
}
```

## Adding Featured Content

Edit `/home/user/habla/app/featured.ts`:

```typescript
export const FEATURED_AUTHORS = [
  {
    npub: "npub1...",
    nip05: "alice@example.com",
    relays: ["wss://relay.nostr.band"],
  },
  // ... more authors
];

export const FEATURED_ARTICLES = [
  {
    author: "npub1...",
    identifier: "article-slug",
    relays: ["wss://relay.nostr.band"],
  },
  // ... more articles
];
```

## Styling Components

### Using Tailwind with cn()

```typescript
import { cn } from "~/lib/utils";

export function StyledComponent({ variant, className }) {
  return (
    <div className={cn(
      "px-4 py-2 rounded-lg",  // Base styles
      variant === "primary" && "bg-blue-500 text-white",
      variant === "secondary" && "bg-gray-200 text-gray-900",
      className  // Allow override
    )}>
      Content
    </div>
  );
}
```

### Using CSS Variables

```css
/* In app.css */
:root {
  --color-primary: #3b82f6;
  --color-secondary: #64748b;
}

.dark {
  --color-primary: #60a5fa;
  --color-secondary: #94a3b8;
}
```

```typescript
<div className="bg-[var(--color-primary)]">
  Themed content
</div>
```

## Error Handling

### Loader errors

```typescript
import { redirect } from "react-router";

export async function loader({ params }: Route.LoaderArgs) {
  const data = await fetchData(params.id);

  if (!data) {
    throw new Response("Not Found", { status: 404 });
  }

  return { data };
}
```

### Component errors

```typescript
import { toast } from "sonner";

async function handleAction() {
  try {
    await performAction();
    toast.success("Success!");
  } catch (error) {
    console.error(error);
    toast.error(error instanceof Error ? error.message : "An error occurred");
  }
}
```

## Testing Locally

### Start Development Server

```bash
npm run dev
```

### Test Production Build

```bash
pnpm build     # -> build/client
pnpm preview   # serves it with the SPA fallback on :4173
```

The fallback matters: without it, a deep link like `/verbiricha/grimoire`
404s instead of booting the app.

### Type Check

```bash
npm run typecheck
```

## Best Practices Checklist

- [ ] Run `npm run typecheck` after route changes
- [ ] Use `.client.tsx` for browser-only code
- [ ] Use `.server.ts` for server-only code
- [ ] Handle loading and error states
- [ ] Clean up subscriptions on unmount
- [ ] Cache events in EventStore when possible
- [ ] Use `cn()` for conditional classes
- [ ] Always handle async errors
- [ ] Never expose private keys
- [ ] Validate Nostr signatures
