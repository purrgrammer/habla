import type { Route } from "./+types/address";
import { kinds, nip19 } from "nostr-tools";
import { firstValueFrom } from "rxjs";
import {
  addressLoader as clientAddressLoader,
  profileLoader as clientProfileLoader,
} from "~/services/loaders.client";
import {
  addressLoader as serverAddressLoader,
  profileLoader as serverProfileLoader,
} from "~/services/loaders.server";
import Article from "~/ui/nostr/article";
import ArticleConversation from "~/ui/nostr/article-conversation.client";
import {
  getArticleTitle,
  getArticleSummary,
  getArticleImage,
  getArticlePublished,
  getDisplayName,
  getProfileContent,
} from "applesauce-core/helpers";
import defaults from "~/seo";
import ClientOnly from "~/ui/client-only";

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return defaults;
  const { event, author } = loaderData;
  const title = `${getArticleTitle(event)} - ${getDisplayName(author)}`;
  const description = getArticleSummary(event);
  const image = getArticleImage(event);
  const publishedAt = getArticlePublished(event);
  // TODO: author meta tags
  return [
    { title },
    { name: "og:title", content: title },
    { name: "og:type", content: "article" },
    ...(description
      ? [
          { name: "description", content: description },
          { name: "og:description", content: description },
        ]
      : []),
    ...(image ? [{ name: "og:image", content: image }] : []),
  ];
}

// TODO: fail on non long form articles
export async function loader({ params }: Route.MetaArgs) {
  const { naddr } = params;
  const decoded = nip19.decode(naddr);
  if (decoded?.type === "naddr") {
    // TODO: might not have relays metadata
    // TODO: might throw, 404 instead
    const [author, event] = await Promise.all([
      firstValueFrom(
        serverProfileLoader({
          kind: kinds.Metadata,
          pubkey: decoded.data.pubkey,
        }),
      ).then(getProfileContent),
      firstValueFrom(serverAddressLoader(decoded.data)),
    ]);
    return { author, event, address: decoded.data };
  }
}

export async function clientLoader({ params }: Route.MetaArgs) {
  const { naddr } = params;
  const decoded = nip19.decode(naddr);
  if (decoded?.type === "naddr") {
    const [author, event] = await Promise.all([
      firstValueFrom(
        clientProfileLoader({
          kind: kinds.Metadata,
          pubkey: decoded.data.pubkey,
        }),
      ).then(getProfileContent),
      firstValueFrom(clientAddressLoader(decoded.data)),
    ]);
    return { author, event, address: decoded.data };
  }
}

const components: Record<number, any> = {
  [kinds.LongFormArticle]: Article,
};

export default function Address(props: Route.ComponentProps) {
  if (!props?.loaderData) return null;
  const Component = components[props.loaderData.address.kind];
  return Component ? <Component {...props.loaderData} /> : <>TODO</>;
}
