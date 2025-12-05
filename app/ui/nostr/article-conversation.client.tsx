import { type NostrEvent, kinds } from "nostr-tools";
import { map } from "rxjs";
import { type FeedComponent, PureFeed } from "~/ui/nostr/feed.client";
import Highlight from "./highlight";
import NostrCard from "./card";
import {
  parseZap,
  useRelays,
  useTimeline,
  useZaps,
  type Zap,
} from "~/hooks/nostr.client";
import Note from "./note";
import {
  getAddressPointerForEvent,
  getReplaceableAddress,
  getZapPayment,
  getZapRequest,
  getZapSender,
} from "applesauce-core/helpers";
import Zaps, { ZapButton } from "../zaps.client";
import Debug from "../debug";
import { EventReply, Reply } from "./reply.client";
import { useMemo, useState } from "react";
import { useEventStore, useObservableMemo } from "applesauce-react/hooks";
import { isReplaceableKind } from "nostr-tools/kinds";
import { Bookmark, MessageCircle, Share } from "lucide-react";
import { Button } from "../button";
import { COMMENT } from "~/const";
import CommentDialog from "./comment-dialog.client";
import ArticleCard from "./article-card";
import NumberFlow from "@number-flow/react";

const components: Record<number, FeedComponent> = {
  [kinds.Highlights]: ({ event, profile }) => {
    return (
      <NostrCard key={event.id} event={event} noFooter className="border-none">
        <Highlight
          noHeader
          footer="hidden"
          event={event}
          blockquote="text-md italic font-sans"
        />
      </NostrCard>
    );
  },
  [kinds.ShortTextNote]: ({ event }) => {
    return (
      <NostrCard
        key={event.id}
        event={event}
        noFooter
        className="border-none bg-transparent"
      >
        <Note event={event} />
      </NostrCard>
    );
  },
};

function Highlights({
  event,
  relays,
}: {
  event: NostrEvent;
  relays: string[];
}) {
  const a = getReplaceableAddress(event);
  const filters = {
    kinds: [kinds.Highlights],
    "#a": [a],
  };
  const { timeline: highlights, isLoading } = useTimeline(
    `${a}-highlights`,
    filters,
    relays,
    {
      limit: 50,
    },
  );
  return (
    <PureFeed feed={highlights} isLoading={isLoading} components={components} />
  );
}

function Comments({ event, relays }: { event: NostrEvent; relays: string[] }) {
  const a = getReplaceableAddress(event);
  const filters = {
    kinds: [kinds.ShortTextNote],
    "#a": [a],
  };
  const { timeline, isLoading } = useTimeline(
    `${a}-comments`,
    filters,
    relays,
    {
      limit: 50,
    },
  );
  return (
    <PureFeed feed={timeline} isLoading={isLoading} components={components} />
  );
}

function isReply(event: NostrEvent): boolean {
  return (
    event.kind === kinds.ShortTextNote &&
    event.tags.some((t) => t[0] === "e" && t[3] === "reply")
  );
}

export default function EventConversation({
  event,
  relays,
}: {
  event: NostrEvent;
  relays: string[];
}) {
  useZaps(event);
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const id = isReplaceableKind(event.kind)
    ? getReplaceableAddress(event)
    : event.id;
  const filters = [
    {
      kinds: [1111],
      ...(isReplaceableKind(event.kind) ? { "#A": [id] } : { "#E": [id] }),
      "#K": [String(event.kind)],
    },
    {
      kinds: [kinds.Highlights, kinds.Zap, kinds.ShortTextNote],
      ...(isReplaceableKind(event.kind) ? { "#a": [id] } : { "#e": [id] }),
    },
  ];
  useTimeline(`${id}-comments`, filters, relays, {
    limit: 200,
  });
  const eventStore = useEventStore();
  const total = useObservableMemo(() => {
    return eventStore
      .timeline({
        kinds: [kinds.Zap],
        ...(isReplaceableKind(event.kind) ? { "#a": [id] } : { "#e": [id] }),
      })
      .pipe(
        map((events) => {
          return events
            .map(parseZap)
            .filter(Boolean)
            .reduce((acc, ev) => acc + (ev as Zap).amount, 0);
        }),
      );
  }, [id]);
  const eventsStored = useObservableMemo(() => {
    return eventStore.timeline(filters, false);
  }, [id]);
  const comments = useObservableMemo(() => {
    return eventStore.timeline({
      kinds: [COMMENT, kinds.ShortTextNote],
      ...(isReplaceableKind(event.kind) ? { "#a": [id] } : { "#e": [id] }),
    });
  }, [id]);
  return (
    <div className="flex flex-col gap-12 pb-16 items-center w-full">
      <div className="flex flex-row gap-2">
        {/* <CommentDialog
          event={event}
          showCommentDialog={showCommentDialog}
          setShowCommentDialog={setShowCommentDialog}
          trigger={
            <Button variant="outline" className="rounded-xl" size="xl">
              <div className="flex flex-row gap-3">
                <MessageCircle className="size-12 text-muted-foreground" />
                <span className="text-4xl font-mono">
                  <NumberFlow value={comments?.length || 0} />
                </span>
              </div>
            </Button>
          }
        >
          {event.kind === kinds.LongFormArticle ? (
            <ArticleCard
              noHeader
              address={getAddressPointerForEvent(event)}
              article={event}
            />
          ) : (
            <EventReply event={event} includeReplies={false} />
          )}
        </CommentDialog> */}
        <ZapButton pubkey={event.pubkey} event={event} total={total || 0} />
        {/*
        <Button variant="outline" className="rounded-xl" size="xl">
          <Bookmark className="size-12 text-muted-foreground" />
        </Button>
        <Button variant="outline" className="rounded-xl" size="xl">
          <Share className="size-12 text-muted-foreground" />
        </Button>
         */}
      </div>
      <div className="flex flex-col w-full gap-3">
        {eventsStored
          ?.filter((ev) => !isReply(ev))
          .map((ev) => (
            <EventReply key={ev.id} event={ev} includeReplies />
          ))}
      </div>
    </div>
  );
}

export function Conversation({ event }: { event: NostrEvent }) {
  const relays = useRelays(event.pubkey);
  return <EventConversation event={event} relays={relays} />;
}
