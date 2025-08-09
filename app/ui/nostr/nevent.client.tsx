import { kinds } from "nostr-tools";
import { type EventPointer } from "nostr-tools/nip19";
import { useEvent } from "~/hooks/nostr.client";
import Note from "~/ui/nostr/note";
import ArticleLink from "~/ui/nostr/article-link";
import { getTagValue } from "applesauce-core/helpers";
import { Card as SkeletonCard } from "~/ui/skeleton";
import File from "~/ui/nostr/file";
import NostrCard from "./card";
import UnknownKind from "./unknown-kind";

export default function NEvent(props: EventPointer) {
  const event = useEvent(props);
  if (event?.kind === kinds.LongFormArticle) {
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
  }
  return event ? (
    <NostrCard event={event}>
      {event.kind === kinds.ShortTextNote ? (
        <Note event={event} />
      ) : event.kind === kinds.FileMetadata ? (
        <File event={event} />
      ) : (
        <UnknownKind event={event} />
      )}
    </NostrCard>
  ) : (
    <SkeletonCard />
  );
}
