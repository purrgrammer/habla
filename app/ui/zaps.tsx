import { type NostrEvent } from "nostr-tools";
import { useZaps, type Zap } from "~/hooks/nostr";
import UserLink from "./nostr/user-link";
import { Badge } from "~/ui/badge";
import { CurrencyAmount } from "~/ui/currency";
import { getZapRequest, getZapSender } from "applesauce-core/helpers";
import { Button } from "~/ui/button";
import ZapDialog from "~/ui/nostr/zap";
import { useState } from "react";
import { Reply } from "./nostr/reply";
import { cn } from "~/lib/utils";
import { BIG_ZAP_AMOUNT } from "~/const";

export function ZapReply({ zap }: { zap: Zap }) {
  const sender = getZapSender(zap);
  const req = getZapRequest(zap);
  const comment = req?.content;
  return (
    <Reply author={sender} amount={zap.amount} comment={comment} event={zap} />
  );
}

const pillSizes: Record<
  "sm" | "lg",
  { text: string; amount: string; icon: string; avatar: string }
> = {
  sm: {
    text: "text-sm",
    icon: "size-4",
    amount: "text-sm",
    avatar: "size-4",
  },
  lg: {
    text: "text-lg",
    icon: "",
    amount: "",
    avatar: "size-5",
  },
};

export function ZapPill({
  zap,
  size = "lg",
}: {
  zap: Zap;
  size?: "sm" | "lg";
}) {
  const { avatar, text, amount, icon } = pillSizes[size];
  const sender = getZapSender(zap);
  const isBig = zap.amount >= BIG_ZAP_AMOUNT;
  const req = getZapRequest(zap);
  const comment = req?.content;
  return (
    <Badge variant={isBig ? "golden" : "pill"}>
      <div className="flex flex-row items-center flex-wrap gap-3">
        <UserLink img={avatar} name={text} pubkey={sender} />
        <CurrencyAmount
          iconClassname={icon}
          amount={zap.amount}
          amountClassname={amount}
          className={text}
        />
        {comment && comment.length < 42 ? (
          <p
            className={cn(
              "max-w-[80dvw] overflow-hidden overflow-x-scroll no-scrollbar font-light line-clamp-1",
              text,
            )}
          >
            {comment}
          </p>
        ) : null}
      </div>
    </Badge>
  );
}

export function ZapButton({
  pubkey,
  total,
  event,
}: {
  pubkey: string;
  total: number;
  event?: NostrEvent;
}) {
  const [showDialog, setShowDialog] = useState(false);
  return (
    <ZapDialog
      open={showDialog}
      onOpenChange={setShowDialog}
      pubkey={pubkey}
      event={event}
      trigger={
        <Button variant="outline" className="rounded-xl" size="xl">
          <div className="flex flex-col items-center gap-3">
            <CurrencyAmount amount={total} size="xl" />
          </div>
        </Button>
      }
    ></ZapDialog>
  );
}

export function ZapPills({
  event,
  size = "sm",
  className,
}: {
  event: NostrEvent;
  size?: "sm" | "lg";
  className?: string;
}) {
  const { zaps, total } = useZaps(event) ?? {
    total: 0,
    zaps: [],
  };
  return zaps.length > 0 ? (
    <div className={`flex flex-row flex-wrap w-full gap-1 ${className}`}>
      {zaps?.map((zap) => (
        <ZapPill key={zap.id} zap={zap} size={size} />
      ))}
    </div>
  ) : null;
}

export default function Zaps({ event }: { event: NostrEvent }) {
  const [showDialog, setShowDialog] = useState(false);
  const { zaps, total } = useZaps(event) ?? {
    total: 0,
    zaps: [],
  };
  return (
    <div className="flex flex-col items-center gap-8 w-full">
      <ZapDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        pubkey={event.pubkey}
        event={event}
        trigger={
          <Button variant="outline" className="rounded-xl" size="xl">
            <div className="flex flex-col items-center gap-3">
              <CurrencyAmount amount={total} size="xl" />
            </div>
          </Button>
        }
      ></ZapDialog>
      {zaps.length > 0 ? (
        <div className="flex flex-col w-full gap-3">
          {zaps?.map((zap) => (
            <ZapReply key={zap.id} zap={zap} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
