import { kinds, type NostrEvent } from "nostr-tools";
import { type EventPointer } from "nostr-tools/nip19";
import { useEvent } from "~/hooks/nostr.client";
import Note from "~/ui/nostr/note";
import ArticleLink from "~/ui/nostr/article-link.client";
import { getTagValue } from "applesauce-core/helpers";
import { Card as SkeletonCard } from "~/ui/skeleton";
import File from "~/ui/nostr/file";
import NostrCard from "./card";
import UnknownKind from "./unknown-kind";
import { PureHighlight } from "./highlight";
import type { ReactNode } from "react";

interface ComponentProps {
  event: NostrEvent;
}

type Component = (props: ComponentProps) => ReactNode;

const components: Record<number, Component> = {
  [kinds.ShortTextNote]: ({ event }) => (
    <NostrCard noFooter event={event}>
      <Note event={event} />
    </NostrCard>
  ),
  [kinds.FileMetadata]: File,
  [kinds.Highlights]: ({ event }) => (
    <NostrCard noFooter event={event}>
      <PureHighlight event={event} />
    </NostrCard>
  ),
  [kinds.LongFormArticle]: ({ event }) => {
    return (
      <ArticleLink
        article={event}
        address={{
          kind: kinds.LongFormArticle,
          pubkey: event.pubkey,
          identifier: getTagValue(event, "d") || "",
        }}
      />
    );
  },
};

export default function NEvent(props: EventPointer) {
  const event = useEvent(props);
  if (!event) {
    return <SkeletonCard />;
  }

  const Component = components[event?.kind];
  return Component ? (
    <Component event={event} />
  ) : (
    <UnknownKind event={event} />
  );
}
