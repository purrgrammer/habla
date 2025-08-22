import { kinds } from "nostr-tools";
import { type AddressPointer } from "nostr-tools/nip19";
import { useAddress } from "~/hooks/nostr.client";
import ArticleLink from "~/ui/nostr/article-link.client";
import NAddrLink from "./naddr-link";
import NostrCard from "./card";
import EmojiSet from "~/ui/nostr/emoji-set";
import UnknownKind from "./unknown-kind";
import { Card as SkeletonCard } from "~/ui/skeleton";

export default function NAddr(props: AddressPointer) {
  const event = useAddress(props);
  if (!event)
    return (
      <NAddrLink
        {...props}
        className="text-primary hover:underline hover:decoration-dotted break-all line-clamp-1"
      />
    );
  if (event.kind === kinds.LongFormArticle) {
    return (
      <ArticleLink
        address={props}
        article={event}
        className="text-primary hover:underline hover:decoration-dotted"
      />
    );
  }
  return event ? (
    <NostrCard event={event}>
      {event.kind === kinds.Emojisets ? (
        <EmojiSet event={event} />
      ) : (
        <UnknownKind event={event} />
      )}
    </NostrCard>
  ) : (
    <SkeletonCard />
  );
}
