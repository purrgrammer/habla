import { Link } from "react-router";
import { type NostrEvent, nip19 } from "nostr-tools";
import { type AddressPointer } from "nostr-tools/nip19";
import {
  type ProfileContent,
  getArticleTitle,
  getArticleImage,
  getArticleSummary,
} from "applesauce-core/helpers";
import UserLink from "~/ui/nostr/user-link";
import { Card, CardHeader, CardContent } from "~/ui/card";
import { Tags } from "~/ui/tag";
import ArticleLink from "./article-link";

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
  const tags = getHashtags(article);
  const title = getArticleTitle(article);
  const picture = "/family.png";
  const image = getArticleImage(article);
  const summary = getArticleSummary(article) || article.content;
  if (!title) return null;
  return (
    <ArticleLink
      article={article}
      address={address}
      className="flex flex-col gap-2 h-full"
    >
      <div className="flex flex-col gap-1 flex-1">
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
      </div>
      <Tags className="py-0 mt-auto pointer-events-none" tags={tags} />
    </ArticleLink>
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
  if (!title) return null;
  return (
    <Card className="gap-0 p-0 border-none h-full">
      {noHeader ? null : (
        <CardHeader className="p-2 pb-0">
          <div className="flex flex-row items-center justify-between gap-2">
            <UserLink
              pubkey={article.pubkey}
              profile={author}
              img="size-10"
              name="text-2xl"
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
