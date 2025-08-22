import { type NostrEvent, kinds } from "nostr-tools";
import { type FeedComponent, PureFeed } from "~/ui/nostr/feed.client";
import Highlight from "./highlight";
import NostrCard from "./card";
import { useTimeline } from "~/hooks/nostr.client";
import Note from "./note";
import { getReplaceableAddress } from "applesauce-core/helpers";
import Zaps from "../zaps.client";

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

export default function ArticleConversation({
  event,
  relays,
}: {
  event: NostrEvent;
  relays: string[];
}) {
  return (
    <div className="flex flex-col gap-12 pb-16 items-center">
      <Zaps event={event} />
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
