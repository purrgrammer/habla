import { type NostrEvent } from "nostr-tools";
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
import ArticleConversation from "./article-conversation.client";
import ClientOnly from "../client-only";

function Author({
  author,
  article,
}: {
  author?: ProfileContent;
  article: NostrEvent;
}) {
  const publishedAt = getArticlePublished(article);
  return (
    <div className="flex flex-row items-center gap-2 sm:gap-4 justify-between select-none w-full">
      <UserLink
        className="hover:underline"
        name="text-lg sm:text-xl"
        img="size-10 xsm:size-12 flex-shrink-0"
        pubkey={article.pubkey}
        profile={author}
        withNip05
      />
      <span className="text-right font-light text-muted-foreground text-sm sm:text-base">
        <Timestamp timestamp={publishedAt} />
      </span>
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
      <h1 className="font-sans font-normal text-3xl sm:text-4xl lg:text-5xl text-balance mb-4">
        {title}
      </h1>
      {summary ? (
        <Blockquote
          className="not-italic font-sans text-lg sm:text-xl font-light leading-relaxed mb-4"
          text={summary}
        />
      ) : null}
      <article className="prose pb-8">
        <Markdown>{content}</Markdown>
      </article>
    </div>
  );
}

export default function Article(props: {
  author?: ProfileContent;
  event: NostrEvent;
  address: AddressPointer;
}) {
  const { author, event } = props;
  const title = getArticleTitle(event);
  const image = getArticleImage(event);
  const summary = getArticleSummary(event);
  return (
    <div className="flex flex-col gap-4 sm:gap-6 w-full">
      <Author article={event} author={author} />
      <PureArticle
        title={title}
        summary={summary}
        image={image}
        content={event.content}
      />
      <ClientOnly>{() => <ArticleConversation {...props} />}</ClientOnly>
    </div>
  );
}
