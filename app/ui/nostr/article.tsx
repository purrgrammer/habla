import { type NostrEvent, nip19 } from "nostr-tools";
import { cn } from "~/lib/utils";
import { type AddressPointer } from "nostr-tools/nip19";
import {
  type ProfileContent,
  getArticleTitle,
  getArticleImage,
  getArticleSummary,
  getArticlePublished,
  getSeenRelays,
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
import { Pencil, Share2, Copy, Check } from "lucide-react";
import { useActiveAccount } from "applesauce-react/hooks";
import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/ui/dialog";
import { info } from "~/services/notifications";
import { useArticleLink } from "~/ui/nostr/article-link";

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

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      info("Copied to clipboard");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground w-12 shrink-0">
        {label}
      </span>
      <input
        readOnly
        value={value}
        className="flex-1 min-w-0 rounded-md border bg-muted px-3 py-1.5 text-sm truncate"
      />
      <button
        type="button"
        onClick={copy}
        className="inline-flex items-center justify-center size-8 shrink-0 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      >
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      </button>
    </div>
  );
}

function ShareButton({
  address,
  event,
  relays,
}: {
  address: AddressPointer;
  event: NostrEvent;
  relays: Relay[];
}) {
  const seenRelays = getSeenRelays(event);
  const naddr = useMemo(() => {
    return nip19.naddrEncode({
      ...address,
      relays: seenRelays?.size ? [...seenRelays] : relays,
    });
  }, [address, seenRelays, relays]);

  const articlePath = useArticleLink(event, address);
  const hablaUrl = `https://habla.news${articlePath}`;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
        >
          <Share2 className="size-4" />
          Share
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Article</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <CopyField label="Link" value={hablaUrl} />
          <CopyField label="Nostr" value={naddr} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Author({
  author,
  article,
  address,
  relays,
}: {
  author?: ProfileContent;
  article: NostrEvent;
  address?: AddressPointer;
  relays: Relay[];
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
          <ClientOnly>
            {() => (
              <>
                <ShareButton
                  address={address}
                  event={article}
                  relays={relays}
                />
                <EditButton address={address} />
              </>
            )}
          </ClientOnly>
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
      <Author
        article={event}
        author={author}
        address={address}
        relays={props.relays}
      />
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
