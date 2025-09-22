import { type NostrEvent } from "nostr-tools";
import { useZaps, type Zap } from "~/hooks/nostr.client";
import UserLink from "./nostr/user-link";
import { Badge } from "~/ui/badge";
import { CurrencyAmount } from "~/ui/currency.client";
import { getZapRequest, getZapSender } from "applesauce-core/helpers";
import { Button } from "~/ui/button";
import ZapDialog from "~/ui/nostr/zap.client";
import { useState } from "react";
import { Reply } from "./nostr/reply.client";

export function ZapReply({ zap }: { zap: Zap }) {
  const sender = getZapSender(zap);
  const req = getZapRequest(zap);
  const comment = req?.content;
  return (
    <Reply author={sender} amount={zap.amount} comment={comment} event={zap} />
  );
}

export function ZapPill({ zap }: { zap: Zap }) {
  const sender = getZapSender(zap);
  const req = getZapRequest(zap);
  const comment = req?.content;
  return (
    <Badge variant="pill">
      <div className="flex flex-row items-center flex-wrap gap-3">
        <UserLink img="size-5" name="text-lg" pubkey={sender} />
        <CurrencyAmount amount={zap.amount} className="flex-row" />
        {comment && comment.length < 42 ? (
          <p className="text-lg max-w-[80dvw] overflow-hidden overflow-x-scroll no-scrollbar font-light text-muted-foreground line-clamp-1">
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
