import type { Route } from "./+types/article";
import { kinds } from "nostr-tools";
import { queryProfile } from "nostr-tools/nip05";
import { default as clientStore } from "~/services/data";
import { default as serverStore } from "~/services/data.server";
import Article from "~/ui/nostr/article";
import defaults, { articleMeta } from "~/seo";
import ClientOnly from "~/ui/client-only";
import ArticleConversation from "~/ui/nostr/article-conversation";
import type { DataStore } from "~/services/types";

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return defaults;
  const { event, author } = loaderData;
  return articleMeta(event, author);
}

async function loadData(store: DataStore, { params }: Route.MetaArgs) {
  const { nip05, identifier } = params;
  const pointer = await queryProfile(nip05);
  if (pointer) {
    const address = { ...pointer, kind: kinds.LongFormArticle, identifier };
    const [author, relays, event] = await Promise.all([
      store.fetchProfile({ pubkey: pointer.pubkey, relays: pointer.relays }),
      store.fetchRelays(pointer.pubkey),
      store.fetchAddress(address),
    ]);
    if (event && author && relays) {
      return { author, event, relays, pointer, address };
    }
  }
}

export async function loader(args: Route.MetaArgs) {
  return loadData(serverStore, args);
}

export async function clientLoader(args: Route.MetaArgs) {
  return loadData(clientStore, args);
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
