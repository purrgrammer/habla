import type { ReactElement } from "react";
import type { Pubkey } from "~/types";
import { motion, AnimatePresence } from "motion/react";
import { kinds, type NostrEvent } from "nostr-tools";
import { map, distinctUntilChanged } from "rxjs";
import { CurrencyAmount } from "../currency.client";
import UserLink from "./user-link.client";
import Note from "./note";
import RichText from "./rich-text.client";
import Timestamp from "../timestamp";
import { isReplaceableKind } from "nostr-tools/kinds";
import { useProfile, useRelays, useTimeline } from "~/hooks/nostr.client";
import Debug from "../debug";
import { useEventStore, useObservableMemo } from "applesauce-react/hooks";
import {
  getZapPayment,
  getZapRequest,
  getZapSender,
} from "applesauce-core/helpers";
import { useMemo, useState } from "react";
import { Button } from "../button";
import {
  ChevronDown,
  ChevronUp,
  Highlighter,
  MessageCircle,
  Minus,
  Plus,
  StickyNote,
} from "lucide-react";
import Blockquote from "../blockquote";
import { Avatar } from "./user";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "~/ui/hover-card";

export function EventReply({
  event,
  includeReplies,
}: {
  event: NostrEvent;
  includeReplies?: boolean;
}) {
  const zapRequest = useMemo(() => {
    try {
      return event.kind === kinds.Zap ? getZapRequest(event) : null;
    } catch (error) {
      console.error("Error getting zap request:", error);
      return null;
    }
  }, [event]);
  const zapPayment = useMemo(() => {
    try {
      return event.kind === kinds.Zap ? getZapPayment(event) : null;
    } catch (error) {
      console.error("Error getting zap payment:", error);
      return null;
    }
  }, [event]);
  const author =
    event.kind === kinds.Zap && zapRequest ? zapRequest.pubkey : event.pubkey;
  const amount =
    event.kind === kinds.Zap && zapPayment?.amount
      ? zapPayment.amount / 1000
      : undefined;
  const comment =
    event.kind === kinds.Zap && zapRequest?.content
      ? zapRequest.content
      : event.content;
  return (
    <Reply
      author={author}
      comment={comment}
      amount={amount}
      event={event}
      includeReplies={includeReplies}
    />
  );
}

function PubkeyAvatar({
  pubkey,
  className,
}: {
  pubkey: Pubkey;
  className?: string;
}) {
  const profile = useProfile(pubkey);
  return (
    <HoverCard>
      <HoverCardTrigger>
        <Avatar profile={profile} className={className} />
      </HoverCardTrigger>
      <HoverCardContent>
        <div className="flex flex-col gap-2">
          <UserLink
            pubkey={pubkey}
            profile={profile}
            withNip05
            nip05="line-clamp-1 text-xs"
            img="size-12"
            className="gap-1"
          />
          <p className="text-muted-foreground text-sm line-clamp-5">
            {profile?.about}
          </p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

function Pubkeys({ pubkeys, max = 5 }: { pubkeys: Pubkey[]; max?: number }) {
  const shownPubkeys = pubkeys.slice(0, max);
  const restPubkeys = pubkeys.slice(max);
  if (restPubkeys.length > 0) {
    return (
      <div className="flex flex-row items-center gap-1">
        <div className="*:data-[slot=avatar]:ring-background flex -space-x-1 *:data-[slot=avatar]:ring-2">
          {shownPubkeys.map((pubkey) => (
            <PubkeyAvatar key={pubkey} pubkey={pubkey} className="size-6" />
          ))}
        </div>
        <span className="text-sm text-muted-foreground">
          & {restPubkeys.length} more
        </span>
      </div>
    );
  }
  return (
    <div className="*:data-[slot=avatar]:ring-background flex -space-x-1 *:data-[slot=avatar]:ring-2">
      {shownPubkeys.map((pubkey) => (
        <PubkeyAvatar key={pubkey} pubkey={pubkey} className="size-6" />
      ))}
    </div>
  );
}

const iconCls = "size-5 text-muted-foreground";
const icons: Record<number, ReactElement> = {
  [kinds.Highlights]: <Highlighter className={iconCls} />,
  [kinds.ShortTextNote]: <StickyNote className={iconCls} />,
  [1111]: <MessageCircle className={iconCls} />,
};
const verbs: Record<number, string> = {
  [kinds.Highlights]: "highlighted",
  [kinds.ShortTextNote]: "noted",
  [1111]: "commented",
  [kinds.Zap]: "zapped",
};

function Repliers({ replies }: { replies: NostrEvent[] }) {
  const [showReplies, setShowReplies] = useState(false);
  const repliers = [
    ...new Set(
      replies.map((r) => {
        if (r.kind === kinds.Zap) return getZapSender(r);
        return r.pubkey;
      }),
    ),
  ];
  return (
    <div className="flex flex-col gap-0">
      <div className="flex flex-row items-center justify-between pl-1">
        {replies?.length > 0 && (
          <Button
            variant="link"
            size="icon"
            className="size-6 text-muted-foreground hover:text-primary"
            onClick={() => setShowReplies(!showReplies)}
          >
            {showReplies ? <Minus /> : <Plus />}
          </Button>
        )}
        <Pubkeys pubkeys={repliers} />
      </div>
      <AnimatePresence>
        {showReplies ? (
          <motion.div
            className="pt-2 pl-4 flex flex-col gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {replies.map((r) => (
              <EventReply event={r} />
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function Replies({ author, event }: { author: Pubkey; event?: NostrEvent }) {
  const relays = useRelays(event?.pubkey || author);
  const tagFilter =
    event && isReplaceableKind(event.kind)
      ? {
          "#a": [],
        }
      : event
        ? {
            "#e": [event?.id],
          }
        : {};
  const filters = [
    {
      kinds: [1111],
      "#p": [author],
      ...tagFilter,
      ...(event ? { "#k": [String(event.kind)] } : {}),
    },
    {
      kinds: [kinds.Zap, kinds.ShortTextNote],
      "#p": [author],
      ...tagFilter,
    },
  ];
  useTimeline(`${event?.id}-replies`, filters, relays);
  const eventStore = useEventStore();
  const replies = useObservableMemo(() => {
    return eventStore
      .timeline(filters)
      .pipe(map((replies) => replies.reverse()));
  }, [event?.id]);
  return replies ? <Repliers replies={replies} /> : null;
}

export function Reply({
  author,
  comment,
  amount,
  event,
  includeReplies,
}: {
  author: Pubkey;
  comment: string;
  amount?: number;
  event?: NostrEvent;
  includeReplies?: boolean;
}) {
  return (
    <div className="flex flex-col flex-1 gap-2">
      <div className="flex flex-row items-center justify-between">
        <div className="flex flex-row items-center gap-1">
          <UserLink img="size-7" name="line-clamp-1 text-lg" pubkey={author} />
          {event && verbs[event.kind] ? (
            <span className="hidden xsm:block text-lg font-light text-muted-foreground">
              {verbs[event.kind]}
            </span>
          ) : null}
        </div>
        {event ? icons[event.kind] : null}
        {amount ? <CurrencyAmount amount={amount} size="lg" /> : null}
      </div>
      {comment ? (
        <div className="ml-3 border-l-4 p-2 pl-4">
          {event?.kind === kinds.Highlights ? (
            <>
              <span>{event.tags.find((t) => t[0] === "comment")?.[1]}</span>
              <Blockquote className="text-md" text={comment} />
            </>
          ) : (
            <RichText content={comment} />
          )}
        </div>
      ) : null}
      {includeReplies ? <Replies author={author} event={event} /> : null}
    </div>
  );
}
