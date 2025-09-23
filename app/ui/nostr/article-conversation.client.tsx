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
import { isReplaceableKind } from "nostr-tools/kinds";

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
    </div>
  );
}

export function Conversation({ event }: { event: NostrEvent }) {
  const relays = useRelays(event.pubkey);
  return <EventConversation event={event} relays={relays} />;
}
