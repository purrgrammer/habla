import { type NostrEvent, nip19 } from "nostr-tools";
import { cn } from "~/lib/utils";
import { type AddressPointer } from "nostr-tools/nip19";
import {
  type ProfileContent,
  getArticleTitle,
  getArticleImage,
  getArticleSummary,
  getArticlePublished,
} from "applesauce-core/helpers";
import Markdown from "~/ui/markdown";
import UserLink from "~/ui/nostr/user-link";
import Timestamp from "~/ui/timestamp";
import Blockquote from "../blockquote";
import ArticleConversation from "./article-conversation";
import ClientOnly from "../client-only";
import type { Relay } from "~/types";
import { TagCloud } from "../tag-cloud";
import { Link } from "react-router";
import { Pencil } from "lucide-react";
import { useActiveAccount } from "applesauce-react/hooks";

function EditButton({ address }: { address: AddressPointer }) {
  const account = useActiveAccount();
  const isAuthor = account?.pubkey === address.pubkey;

  if (!isAuthor) return null;

  const naddr = nip19.naddrEncode(address);
  return (
    <Link
      to={`/write?edit=${naddr}`}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
    >
      <Pencil className="size-4" />
      Edit
    </Link>
  );
}

function Author({
  author,
  article,
  address,
}: {
  author?: ProfileContent;
  article: NostrEvent;
  address?: AddressPointer;
}) {
  const publishedAt = getArticlePublished(article);
  return (
    <div className="flex flex-row items-center gap-2 sm:gap-4 justify-between select-none w-full">
      <UserLink
        wrapper=""
        name="text-lg sm:text-xl"
        img="size-10 xsm:size-12 flex-shrink-0"
        pubkey={article.pubkey}
        profile={author}
        withNip05
      />
      <div className="flex items-center gap-2">
        {address && (
          <ClientOnly>{() => <EditButton address={address} />}</ClientOnly>
        )}
        <span className="text-right font-light text-muted-foreground text-sm sm:text-base">
          <Timestamp timestamp={publishedAt} />
        </span>
      </div>
    </div>
  );
}

export function PureArticle({
  title,
  image,
  summary,
  content,
  className,
}: {
  title?: string;
  image?: string;
  summary?: string;
  content: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 sm:gap-6", className)}>
      {image ? (
        <img
          src={image}
          className="w-full max-h-[320px] rounded-sm object-cover"
        />
      ) : null}
      <h1 className="font-sans font-normal text-4xl text-balance mb-4">
        {title}
      </h1>
      {summary ? (
        <Blockquote
          className="not-italic font-sans text-lg sm:text-xl font-light leading-relaxed mb-4"
          text={summary}
        />
      ) : null}
      <article className="prose pb-4">
        <Markdown>{content}</Markdown>
      </article>
    </div>
  );
}

export default function Article(props: {
  author?: ProfileContent;
  event: NostrEvent;
  address: AddressPointer;
  relays: Relay[];
}) {
  const { author, event, address } = props;
  const title = getArticleTitle(event);
  const image = getArticleImage(event);
  const summary = getArticleSummary(event);
  const tags = [
    ...new Set(event.tags.filter((t) => t[0] === "t" && t[1]).map((t) => t[1])),
  ];
  return (
    <div className="flex flex-col gap-4 sm:gap-6 w-full">
      <Author article={event} author={author} address={address} />
      <PureArticle
        title={title}
        summary={summary}
        image={image}
        content={event.content}
      />
      <div className="pb-6">
        <TagCloud
          tags={tags.reduce((acc, t) => {
            return { ...acc, [t]: 1 };
          }, {})}
        />
      </div>
      <ClientOnly>{() => <ArticleConversation event={event} />}</ClientOnly>
    </div>
  );
}
