import { type NostrEvent, kinds } from "nostr-tools";
import { type AddressPointer } from "nostr-tools/nip19";
import { Link, Newspaper } from "lucide-react";
import Blockquote from "~/ui/blockquote";
import User from "~/ui/nostr/user";
import Url from "~/ui/url";
import { cn } from "~/lib/utils";
import { type ProfileContent, getTagValue } from "applesauce-core/helpers";
import NAddr from "./naddr";
import NEvent from "./nevent";
import UserLink from "./user-link.client";
import RichText from "./rich-text";

function aToAddress(a: string): AddressPointer {
  const [kind, pubkey, identifier] = a.split(":");
  return { kind: Number(kind), pubkey, identifier };
}

export default function Highlight({
  event,
  noHeader,
  profile,
  blockquote,
  link,
  footer,
}: {
  noHeader?: boolean;
  event: NostrEvent;
  profile?: ProfileContent;
  blockquote?: string;
  link?: string;
  footer?: string;
}) {
  const comment = getTagValue(event, "comment");
  const url = getTagValue(event, "r");
  const a = getTagValue(event, "a");
  const e = getTagValue(event, "e");
  const p = getTagValue(event, "p");
  // TODO: User > OP - article title
  const address = a ? aToAddress(a) : null;
  return (
    <div className="flex flex-col gap-2">
      {noHeader ? null : (
        <div>
          <User pubkey={event.pubkey} profile={profile} />
        </div>
      )}
      {comment ? (
        <div className="font-sans text-lg leading-tight">
          <RichText event={event} content={comment} />
        </div>
      ) : null}
      <Blockquote text={event.content} className={blockquote} />
      <div className={footer}>
        {url ? (
          <div className={cn("flex flex-row gap-2 items-center", link)}>
            <Link className="size-3 flex-shrink-0 text-muted-foreground" />
            <Url href={url} text={event.content} className="line-clamp-1" />
          </div>
        ) : address ? (
          <div className="flex flex-col gap-1">
            <NAddr {...address} className="text-sm" />
            <UserLink pubkey={address.pubkey} img="size-6" name="text-md" />
          </div>
        ) : p ? (
          <UserLink pubkey={p} img="size-6" name="text-md" />
        ) : e ? (
          <NEvent id={e} />
        ) : null}
      </div>
    </div>
  );
}
