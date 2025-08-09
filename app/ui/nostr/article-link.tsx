import { Link } from "react-router";
import { type NostrEvent, nip19 } from "nostr-tools";
import { type AddressPointer } from "nostr-tools/nip19";
import { getArticleTitle } from "applesauce-core/helpers";

export default function ArticleLink({
  article,
  address,
}: {
  article: NostrEvent;
  address: AddressPointer;
}) {
  const title = getArticleTitle(article);
  return (
    <Link
      className="hover:underline hover:decoration-dotted text-primary"
      to={`/a/${nip19.naddrEncode(address)}`}
    >
      {title}
    </Link>
  );
}
