import { Link } from "react-router";
import { type NostrEvent, nip19 } from "nostr-tools";
import { type AddressPointer } from "nostr-tools/nip19";
import { getArticleTitle } from "applesauce-core/helpers";
import type { ReactNode } from "react";

function useAddressLink(address: AddressPointer) {
  return `/a/${nip19.naddrEncode(address)}`;
}

export default function ArticleLink({
  article,
  address,
  children,
  className,
}: {
  article: NostrEvent;
  address: AddressPointer;
  children?: ReactNode;
  className?: string;
}) {
  const link = useAddressLink(address);
  const title = getArticleTitle(article);
  // Using stable link format to fix click handling issues
  // Removed ClientOnly wrapper which was causing hydration/event handling problems
  return (
    <Link to={link} className={className}>
      {children || title}
    </Link>
  );
}
