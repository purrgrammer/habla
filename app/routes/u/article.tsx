import type { Route } from "./+types/article";
import { kinds } from "nostr-tools";
import { queryProfile } from "nostr-tools/nip05";
import {
  fetchProfile as clientFetchProfile,
  fetchAddress as clientFetchAddress,
} from "~/services/loaders.client";
import {
  fetchProfile as serverFetchProfile,
  fetchAddress as serverFetchAddress,
} from "~/services/loaders.server";
import Article from "~/ui/nostr/article";
import defaults, { articleMeta } from "~/seo";
import ClientOnly from "~/ui/client-only";
import ArticleConversation from "~/ui/nostr/article-conversation.client";

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return defaults;
  const { event, author } = loaderData;
  return articleMeta(event, author);
}

export async function loader({ params }: Route.MetaArgs) {
  const { nip05, identifier } = params;
  const pointer = await queryProfile(nip05);
  if (pointer) {
    const address = { ...pointer, kind: kinds.LongFormArticle, identifier };
    const [author, event] = await Promise.all([
      serverFetchProfile(pointer),
      serverFetchAddress(address),
    ]);
    if (event && author) {
      return { author, event, pointer, address };
    }
  }
}

export async function clientLoader({ params }: Route.MetaArgs) {
  const { nip05, identifier } = params;
  const pointer = await queryProfile(nip05);
  if (pointer) {
    const address = { ...pointer, kind: kinds.LongFormArticle, identifier };
    const [author, event] = await Promise.all([
      clientFetchProfile(pointer),
      clientFetchAddress(address),
    ]);
    if (event && author) {
      return { author, event, pointer, address };
    }
  }
}

export default function Identifier({ loaderData }: Route.ComponentProps) {
  if (!loaderData?.event) return null;
  return (
    <div>
      <Article {...loaderData} />
      <ClientOnly>{() => <ArticleConversation {...loaderData} />}</ClientOnly>
    </div>
  );
}
