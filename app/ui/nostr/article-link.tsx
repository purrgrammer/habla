import { Link } from "react-router";
import { type NostrEvent, nip19 } from "nostr-tools";
import { type AddressPointer } from "nostr-tools/nip19";
import { getArticleTitle } from "applesauce-core/helpers";
import ClientOnly from "../client-only";
import ClientArticleLink from "./article-link.client";
import type { ReactNode } from "react";

function useAddressLink(address: AddressPointer) {
  return `/a/${nip19.naddrEncode(address)}`;
}

export default function ArticleLink({
  article,
  address,
  children,
}: {
  article: NostrEvent;
  address: AddressPointer;
  children?: ReactNode;
}) {
  const link = useAddressLink(address);
  const title = getArticleTitle(article);
  return (
    <ClientOnly fallback={<Link to={link}>{children || title}</Link>}>
      {() => (
        <ClientArticleLink article={article} address={address}>
          {children}
        </ClientArticleLink>
      )}
    </ClientOnly>
  );
}
