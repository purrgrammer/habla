import { type NostrEvent, kinds } from "nostr-tools";
import { map } from "rxjs";
import { type FeedComponent, PureFeed } from "~/ui/nostr/feed.client";
import Highlight from "./highlight";
import NostrCard from "./card";
import { parseZap, useTimeline, useZaps, type Zap } from "~/hooks/nostr.client";
import Note from "./note";
import {
  getReplaceableAddress,
  getZapPayment,
  getZapRequest,
  getZapSender,
} from "applesauce-core/helpers";
import Zaps, { ZapButton } from "../zaps.client";
import Debug from "../debug";
import { EventReply, Reply } from "./reply.client";
import { useMemo } from "react";
import { useEventStore, useObservableMemo } from "applesauce-react/hooks";

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

// TODO: generalize to conversation to use for all kinds of events
export default function ArticleConversation({
  event,
  relays,
}: {
  event: NostrEvent;
  relays: string[];
}) {
  useZaps(event);
  const a = getReplaceableAddress(event);
  const filters = [
    {
      kinds: [1111],
      "#A": [a],
      "#K": [String(kinds.LongFormArticle)],
    },
    {
      kinds: [kinds.Highlights, kinds.Zap, kinds.ShortTextNote],
      "#a": [a],
    },
  ];
  useTimeline(`${a}-comments`, filters, relays, {
    limit: 200,
  });
  const eventStore = useEventStore();
  const total = useObservableMemo(() => {
    return eventStore
      .timeline({
        kinds: [kinds.Zap],
        "#a": [a],
      })
      .pipe(
        map((events) => {
          return events
            .map(parseZap)
            .filter(Boolean)
            .reduce((acc, ev) => acc + (ev as Zap).amount, 0);
        }),
      );
  }, [a]);
  const eventsStored = useObservableMemo(() => {
    return eventStore.timeline(filters, false);
  }, [a]);
  return (
    <div className="flex flex-col gap-12 pb-16 items-center w-full">
      <div className="flex flex-col">
        <ZapButton pubkey={event.pubkey} event={event} total={total || 0} />
      </div>
      <div className="flex flex-col w-full gap-3">
        {eventsStored
          ?.filter((ev) => !isReply(ev))
          .map((ev) => (
            <EventReply key={ev.id} event={ev} includeReplies />
          ))}
      </div>
      {/*
      <Tabs defaultValue="highlights" className="w-full">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="highlights">
            <div className={trigger}>
              <Highlighter className={icon} />
            </div>
          </TabsTrigger>
          <TabsTrigger value="comments">
            <div className={trigger}>
              <MessageCircle className={icon} />
            </div>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="highlights">
          <Highlights event={event} relays={relays} />
        </TabsContent>
        <TabsContent value="comments">
          <Comments event={event} relays={relays} />
        </TabsContent>
      </Tabs>
      */}
    </div>
  );
}
