import type { NostrEvent } from "nostr-tools";
import RichText from "./rich-text.client";
import ClientOnly from "../client-only";

export default function RichTextWrapper({
  event,
  content,
}: {
  event?: NostrEvent;
  content?: string;
}) {
  return (
    <ClientOnly fallback={content || event?.content}>
      {() => <RichText event={event} content={content} />}
    </ClientOnly>
  );
}
