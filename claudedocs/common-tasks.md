# Common Tasks Reference

Step-by-step guides for common development tasks in Habla.

## Adding a New Route

1. **Create route file** in `app/routes/`

```typescript
// app/routes/my-new-route.tsx
import type { Route } from "./+types/my-new-route";

export async function loader({ params, request }: Route.LoaderArgs) {
  // Fetch data server-side
  const data = await fetchSomeData(params.id);
  return { data };
}

export default function MyNewRoute({ loaderData }: Route.ComponentProps) {
  return <div>{loaderData.data}</div>;
}
```

2. **Register route** in `app/routes.ts`

```typescript
import { type RouteConfig, route, layout } from "@react-router/dev/routes";

export default [
  layout("routes/layouts/main.tsx", [
    route("/my-new-route", "routes/my-new-route.tsx"),
    // ... other routes
  ]),
] satisfies RouteConfig;
```

3. **Run type generation**

```bash
npm run typecheck
```

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

### Server-Side (in loader)

```typescript
import { dataStore } from "~/services/data.server";
import { INDEX_RELAYS } from "~/const";
import type { Route } from "./+types/profile";

export async function loader({ params }: Route.LoaderArgs) {
  const profile = await dataStore.fetchProfile({
    pubkey: params.pubkey,
    relays: INDEX_RELAYS
  });

  return { profile };
}

export default function Profile({ loaderData }: Route.ComponentProps) {
  return <div>{loaderData.profile.name}</div>;
}
```

### Client-Side (with React Query)

```typescript
import { useQuery } from "@tanstack/react-query";
import { fetchEvent } from "~/services/nostr";
import { INDEX_RELAYS } from "~/const";

export function EventDisplay({ id }: { id: string }) {
  const { data: event, isLoading, error } = useQuery({
    queryKey: ["event", id],
    queryFn: () => fetchEvent({ id, relays: INDEX_RELAYS })
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!event) return <div>Event not found</div>;

  return <div>{event.content}</div>;
}
```

## Publishing Events

### Publish a Note

```typescript
import { usePublisher, useEventFactory } from "applesauce-react/hooks";
import { COMMON_RELAYS } from "~/const";
import { toast } from "sonner";

export function PublishNote({ content }: { content: string }) {
  const publisher = usePublisher();
  const factory = useEventFactory();

  async function handlePublish() {
    try {
      const note = factory.note(content);
      await publisher.publish(note, COMMON_RELAYS);
      toast.success("Note published!");
    } catch (error) {
      toast.error("Failed to publish");
      console.error(error);
    }
  }

  return <button onClick={handlePublish}>Publish</button>;
}
```

### Publish an Article

```typescript
import { usePublisher, useEventFactory } from "applesauce-react/hooks";
import { COMMON_RELAYS } from "~/const";
import { toast } from "sonner";

export function PublishArticle({ title, content, identifier }) {
  const publisher = usePublisher();
  const factory = useEventFactory();
  const [isPublishing, setIsPublishing] = useState(false);

  async function handlePublish() {
    setIsPublishing(true);
    try {
      const article = factory.longFormArticle({
        title,
        content,
        identifier,
        tags: ["nostr", "technology"]  // Optional tags
      });

      await publisher.publish(article, COMMON_RELAYS);
      toast.success("Article published!");
    } catch (error) {
      toast.error("Failed to publish");
      console.error(error);
    } finally {
      setIsPublishing(false);
    }
  }

  return (
    <button onClick={handlePublish} disabled={isPublishing}>
      {isPublishing ? "Publishing..." : "Publish"}
    </button>
  );
}
```

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
// In app/services/loaders.client.ts or loaders.server.ts
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

### Server-Side Errors (in loaders)

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

### Client-Side Errors

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
npm run build
npm run start
```

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
