import { Link } from "react-router";
import { type NostrEvent, nip19 } from "nostr-tools";
import { type AddressPointer } from "nostr-tools/nip19";
import { getArticleTitle, getTagValue } from "applesauce-core/helpers";
import { useUsers } from "~/nostr/queries";
import type { ReactNode } from "react";

function useArticleLink(article: NostrEvent, address: AddressPointer) {
  const { data: users } = useUsers();
  const user = users?.find((u) => u.pubkey === article.pubkey);
  const identifier = getTagValue(article, "d");
  // Temporarily disabled pretty URLs to fix click handling issue
  // if (user && identifier) {
  //   return `/${user.username}/${encodeURIComponent(identifier)}`;
  // }
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
  const title = getArticleTitle(article);
  const link = useArticleLink(article, address);
  return (
    <Link className={className} to={link}>
      {children || title}
    </Link>
  );
}
