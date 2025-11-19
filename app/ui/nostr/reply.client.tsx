import type { ReactElement } from "react";
import type { Pubkey } from "~/types";
import { CircleQuestionMark, Newspaper } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { kinds, nip19, type NostrEvent } from "nostr-tools";
import { map } from "rxjs";
import { CurrencyAmount } from "../currency.client";
import UserLink from "./user-link.client";
import RichText from "./rich-text.client";
import { isReplaceableKind } from "nostr-tools/kinds";
import { useProfile, useRelays, useTimeline } from "~/hooks/nostr.client";
import { useEventStore, useObservableMemo } from "applesauce-react/hooks";
import {
  getSeenRelays,
  getTagValue,
  getZapPayment,
  getZapRequest,
  getZapSender,
} from "applesauce-core/helpers";
import { useMemo, useState } from "react";
import { Button } from "../button";
import {
  Code,
  Highlighter,
  MessageCircle,
  Zap as ZapIcon,
  Minus,
  Plus,
  StickyNote,
  Share,
  ExternalLink,
  Copy,
} from "lucide-react";
import Blockquote from "../blockquote";
import { Avatar } from "./user";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "~/ui/hover-card";
import { ZapPills } from "../zaps.client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/ui/dropdown-menu";
import ZapDialog from "./zap.client";
import { AGGREGATOR_RELAYS, COMMENT } from "~/const";
import { useNavigate } from "react-router";
import { info } from "~/services/notifications.client";
import { Dialog, DialogContent, DialogTitle } from "../dialog";
import CommentDialog from "~/ui/nostr/comment-dialog.client";

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
  [kinds.LongFormArticle]: <Newspaper className={iconCls} />,
  [kinds.Highlights]: <Highlighter className={iconCls} />,
  [kinds.ShortTextNote]: <StickyNote className={iconCls} />,
  [COMMENT]: <MessageCircle className={iconCls} />,
  [kinds.Zap]: <ZapIcon className={iconCls} />,
};
const verbs: Record<number, string> = {
  [kinds.LongFormArticle]: "wrote",
  [kinds.Highlights]: "highlighted",
  [kinds.ShortTextNote]: "noted",
  [COMMENT]: "commented",
  [kinds.Zap]: "zapped",
};
const kindNames: Record<number, string> = {
  [kinds.LongFormArticle]: "Article",
  [kinds.Highlights]: "Highlight",
  [kinds.ShortTextNote]: "Note",
  [COMMENT]: "Comment",
  [kinds.Zap]: "Zap",
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
      kinds: [kinds.ShortTextNote],
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

function EventDialog({
  viewEvent,
  setViewEvent,
  event,
}: {
  viewEvent: boolean;
  setViewEvent: (open: boolean) => void;
  event: NostrEvent;
}) {
  async function copyJSON() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(event, null, 2));
      info("Copied to clipboard");
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  }
  return (
    <Dialog open={viewEvent} onOpenChange={setViewEvent}>
      <DialogContent>
        <DialogTitle>
          <div className="flex flex-row gap-2 items-center">
            {icons[event.kind] || <CircleQuestionMark className={iconCls} />}
            {kindNames[event.kind] || `Kind ${event.kind}`}
          </div>
        </DialogTitle>
        <UserLink
          pubkey={event.kind === kinds.Zap ? getZapSender(event) : event.pubkey}
        />
        <pre className="text-xs bg-muted/40 p-2 rounded-sm font-mono overflow-scroll pretty-scrollbar">
          {JSON.stringify(event, null, 2)}
        </pre>
        <Button variant="secondary" onClick={copyJSON}>
          <Copy />
          Copy
        </Button>
      </DialogContent>
    </Dialog>
  );
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
  const [showZapDialog, setShowZapDialog] = useState(false);
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [viewEvent, setViewEvent] = useState(false);
  const profile = useProfile(
    event?.kind === kinds.Zap ? getZapSender(event) : author,
  );
  const navigate = useNavigate();
  const canShare = typeof window !== "undefined" && window.navigator.share;
  const seenRelays = event ? getSeenRelays(event) : AGGREGATOR_RELAYS;
  const bech32 = useMemo(() => {
    if (!event) return null;
    return isReplaceableKind(event.kind)
      ? nip19.naddrEncode({
          kind: event.kind,
          pubkey: event.pubkey,
          identifier: getTagValue(event, "d") || "",
          relays: seenRelays ? [...seenRelays] : AGGREGATOR_RELAYS,
        })
      : nip19.neventEncode({
          id: event.id,
          author: event.pubkey,
          kind: event.kind,
          relays: seenRelays ? [...seenRelays] : AGGREGATOR_RELAYS,
        });
  }, [event]);
  const bech32Link = useMemo(() => {
    if (!event || !bech32) return null;
    return isReplaceableKind(event.kind) ? `/a/${bech32}` : `/e/${bech32}`;
  }, [bech32]);

  async function open() {
    if (event && bech32Link) {
      navigate(bech32Link);
    }
  }

  async function copyBech32() {
    try {
      if (!bech32) return;
      await navigator.clipboard.writeText(bech32);
      info("Copied to clipboard");
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  }

  async function share() {
    if (event && bech32Link) {
      try {
        const shareData = {
          title: profile
            ? `${kindNames[event.kind] || event.kind} - ${profile?.name || profile?.display_name}`
            : `${kindNames[event.kind] || event.kind}`,
          text: event.content,
          url: `https://habla.news${bech32Link}`,
        };
        await navigator.share(shareData);
      } catch (error) {
        console.error("Error sharing:", error);
      }
    }
  }
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
        {event && showCommentDialog ? (
          <CommentDialog
            showCommentDialog={showCommentDialog}
            setShowCommentDialog={setShowCommentDialog}
            event={event}
          >
            <EventReply event={event} includeReplies={false} />
          </CommentDialog>
        ) : null}
        {event && showZapDialog ? (
          <ZapDialog
            open={showZapDialog}
            onOpenChange={setShowZapDialog}
            pubkey={
              event.kind === kinds.Zap ? getZapSender(event) : event.pubkey
            }
            event={event}
            //hideTitle
            trigger={null}
          >
            {/*<EventReply event={event} includeReplies={false} />*/}
          </ZapDialog>
        ) : null}
        {event ? (
          <EventDialog
            viewEvent={viewEvent}
            setViewEvent={setViewEvent}
            event={event}
          />
        ) : null}
        {event ? (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger>
                {amount ? (
                  <CurrencyAmount amount={amount} size="lg" />
                ) : (
                  icons[event.kind]
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-row items-center gap-1.5">
                      {icons[event.kind] || (
                        <CircleQuestionMark className={iconCls} />
                      )}
                      <span>
                        {kindNames[event.kind] || `Kind ${event.kind}`}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={open}>
                  <div className="flex flex-row items-center gap-1.5">
                    <ExternalLink />
                    <span>Open</span>
                  </div>
                </DropdownMenuItem>
                {bech32Link && canShare ? (
                  <>
                    <DropdownMenuItem onClick={share}>
                      <div className="flex flex-row items-center gap-1.5">
                        <Share />
                        <span>Share</span>
                      </div>
                    </DropdownMenuItem>
                  </>
                ) : null}
                {bech32Link && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={copyBech32}>
                      <div className="flex flex-row items-center gap-1.5">
                        <Copy />
                        <span>Copy event id</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setViewEvent(true)}>
                      <div className="flex flex-row items-center gap-1.5">
                        <Code />
                        <span>View event</span>
                      </div>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowCommentDialog(true)}>
                  <div className="flex flex-row items-center gap-1.5">
                    <MessageCircle />
                    <span>Comment</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowZapDialog(true)}>
                  <div className="flex flex-row items-center gap-1.5">
                    <ZapIcon />
                    <span>Zap</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : null}
      </div>
      {comment ? (
        <div className="flex flex-col gap-2 ml-3 border-l-4 p-2 pl-4">
          {event?.kind === kinds.Highlights ? (
            <>
              <span>{event.tags.find((t) => t[0] === "comment")?.[1]}</span>
              <Blockquote className="text-md" text={comment} />
            </>
          ) : (
            <RichText content={comment} />
          )}
          {event ? <ZapPills event={event} size="sm" className="pt-1" /> : null}
        </div>
      ) : null}
      {includeReplies ? <Replies author={author} event={event} /> : null}
    </div>
  );
}
