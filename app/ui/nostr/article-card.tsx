import { Link } from "react-router";
import { type NostrEvent, nip19 } from "nostr-tools";
import { type AddressPointer } from "nostr-tools/nip19";
import {
  type ProfileContent,
  getArticleTitle,
  getArticleImage,
  getArticleSummary,
  getProfilePicture,
  getArticlePublished,
} from "applesauce-core/helpers";
import UserLink from "~/ui/nostr/user-link";
import { Card, CardHeader, CardContent } from "~/ui/card";
import { Tags } from "~/ui/tag";

function useArticleLink(address: AddressPointer) {
  return `/a/${nip19.naddrEncode(address)}`;
}

function getHashtags(event: NostrEvent): string[] {
  // TODO: cache
  return event.tags.filter((t) => t[0] === "t" && t[1]).map((t) => t[1]);
}

export function PureArticleCard({
  article,
  address,
}: {
  article: NostrEvent;
  address: AddressPointer;
}) {
  const link = useArticleLink(address);
  const tags = getHashtags(article);
  const title = getArticleTitle(article);
  const picture = "/family.png";
  const image = getArticleImage(article);
  const summary = getArticleSummary(article) || article.content;
  if (!title) return null;
  return (
    <div className="flex flex-col gap-2 h-full">
      <Link to={link} className="flex flex-col gap-1">
        <img
          src={image || picture}
          className="w-full h-36 rounded-sm object-cover"
        />
        <div className="flex flex-col gap-1">
          <h2 className="font-sans font-semibold text-2xl text-balance">
            {title}
          </h2>
          <p className="font-sans text-md text-muted-foreground line-clamp-3">
            {summary}
          </p>
        </div>
      </Link>
      <Tags className="py-0 mt-auto" tags={tags} />
    </div>
  );
}

export default function ArticleCard({
  address,
  noHeader,
  author,
  article,
}: {
  address: AddressPointer;
  noHeader?: boolean;
  author?: ProfileContent;
  article: NostrEvent;
}) {
  const title = getArticleTitle(article);
  const picture = author?.banner || getProfilePicture(author) || "/family.png";
  const image = getArticleImage(article);
  const summary = getArticleSummary(article);
  const publishedAt = getArticlePublished(article);
  const tags = getHashtags(article);
  if (!title) return null;
  return (
    <Card className="gap-0 p-0 border-none h-full">
      {noHeader ? null : (
        <CardHeader className="p-2 pb-0">
          <div className="flex flex-row items-center justify-between gap-2">
            <UserLink
              withNip05={true}
              className="hover:underline"
              pubkey={article.pubkey}
              profile={author}
              img="size-10"
              name="text-xl"
            />
          </div>
        </CardHeader>
      )}
      <CardContent className="p-2 h-full">
        <PureArticleCard address={address} article={article} />
      </CardContent>
    </Card>
  );
}
