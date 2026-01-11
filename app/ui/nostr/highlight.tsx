import { type NostrEvent } from "nostr-tools";
import { Link } from "lucide-react";
import Blockquote from "~/ui/blockquote";
import User from "~/ui/nostr/user";
import Url from "~/ui/url";
import { cn } from "~/lib/utils";
import {
  type ProfileContent,
  getEventPointerForEvent,
  getHighlightAttributions,
  getHighlightComment,
  getHighlightSourceAddressPointer,
  getHighlightSourceEventPointer,
  getHighlightSourceUrl,
} from "applesauce-core/helpers";
import NAddr from "./naddr";
import NEvent from "./nevent";
import NEventLink from "./nevent-link";
import UserLink from "./user-link";
import RichText from "./rich-text";

export function PureHighlight({
  event,
  blockquote,
  link,
  footer,
}: {
  event: NostrEvent;
  blockquote?: string;
  link?: string;
  footer?: string;
}) {
  const comment = getHighlightComment(event);
  const url = getHighlightSourceUrl(event);
  const a = getHighlightSourceAddressPointer(event);
  const e = getHighlightSourceEventPointer(event);
  const [p] = getHighlightAttributions(event);
  return (
    <div className="flex flex-col gap-2">
      <NEventLink {...getEventPointerForEvent(event)}>
        <div className="flex flex-col gap-2">
          {comment ? (
            <div className="font-sans text-lg leading-tight">
              <RichText event={event} content={comment} />
            </div>
          ) : null}
          <Blockquote text={event.content} className={blockquote} />
        </div>
      </NEventLink>
      <div className={footer}>
        {url ? (
          <div className={cn("flex flex-row gap-2 items-center", link)}>
            <Link className="size-3 flex-shrink-0 text-muted-foreground" />
            <Url href={url} text={event.content} className="line-clamp-1" />
          </div>
        ) : a ? (
          <div className="flex flex-col gap-1">
            <NAddr {...a} className="text-sm" />
            <UserLink pubkey={a.pubkey} img="size-6" name="text-md" />
          </div>
        ) : p ? (
          <UserLink pubkey={p.pubkey} img="size-6" name="text-md" />
        ) : e ? (
          <NEvent {...e} />
        ) : null}
      </div>
    </div>
  );
}

export default function Highlight({
  event,
  noHeader,
  profile,
  ...props
}: {
  noHeader?: boolean;
  event: NostrEvent;
  profile?: ProfileContent;
  blockquote?: string;
  link?: string;
  footer?: string;
}) {
  return (
    <div className="flex flex-col gap-2 w-full">
      {noHeader ? null : (
        <div>
          <User pubkey={event.pubkey} profile={profile} />
        </div>
      )}
      <PureHighlight event={event} {...props} />
    </div>
  );
}
