import { useMemo } from "react";
import { type NostrEvent, kinds } from "nostr-tools";
import { type FeedComponent, PureFeed } from "~/ui/nostr/feed.client";
import Highlight from "./highlight";
import NostrCard from "./card";
import type { AddressPointer } from "nostr-tools/nip19";
import { useRelays } from "~/hooks/nostr.client";
import { type Zap, useZaps, useTimeline } from "~/hooks/nostr.client";
import Note from "./note";
import { useCurrency, useExchangeRate } from "~/services/currency.client";
import UserLink from "./user-link.client";
import { Badge } from "../badge";
import {
  Highlighter,
  Zap as ZapIcon,
  MessageCircle,
  Bitcoin,
  DollarSign,
  Euro,
  HandCoins,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../tabs";
import { CurrencyAmount } from "../currency.client";

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

function ZapPill({ zap }: { zap: Zap }) {
  const comment = zap.content.trim();
  return (
    <Badge variant="pill">
      <div className="flex flex-row items-center flex-wrap gap-3">
        <UserLink img="size-5" name="text-lg" pubkey={zap.pubkey} />
        <CurrencyAmount amount={zap.amount} />
        {comment && comment.length < 42 ? (
          <p className="text-lg max-w-[80dvw] overflow-hidden overflow-x-scroll no-scrollbar font-light text-muted-foreground line-clamp-1">
            {comment}
          </p>
        ) : null}
      </div>
    </Badge>
  );
}

function Zaps({ zaps }: { zaps: Zap[] }) {
  const total = zaps.reduce((acc, z) => acc + z.amount, 0);
  const { currency, useFiat } = useCurrency();
  const { data: exchangeRate } = useExchangeRate(currency);
  return (
    <div className="flex flex-col items-center gap-16 w-full">
      <div className="flex flex-col items-center gap-3">
        <CurrencyAmount amount={total} size="xl" />
      </div>
      <div className="flex flex-col sm:flex-row gap-2 flex-wrap w-full">
        {zaps.map((zap) => (
          <ZapPill key={zap.id} zap={zap} />
        ))}
      </div>
    </div>
  );
}

function Highlights({
  address,
  event,
  relays,
}: {
  address: AddressPointer;
  event: NostrEvent;
  relays: string[];
}) {
  const a = `${address.kind}:${address.pubkey}:${address.identifier}`;
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

function Comments({
  address,
  relays,
}: {
  address: AddressPointer;
  relays: string[];
}) {
  const a = `${address.kind}:${address.pubkey}:${address.identifier}`;
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

export default function ArticleConversation({ event }: { event: NostrEvent }) {
  const zaps = useZaps(event);
  return (
    <div className="flex flex-col gap-12 pb-16 items-center">
      <Zaps zaps={zaps} />
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
          <Highlights address={address} event={event} relays={relays} />
        </TabsContent>
        <TabsContent value="comments">
          <Comments address={address} relays={relays} />
        </TabsContent>
      </Tabs>
      */}
    </div>
  );
}
