import type { Route } from "./+types/article";
import { kinds } from "nostr-tools";
import { queryProfile } from "nostr-tools/nip05";
import { createDualLoader } from "~/lib/route-loader";
import Article from "~/ui/nostr/article";
import defaults, { articleMeta } from "~/seo";
import ClientOnly from "~/ui/client-only";
import ArticleConversation from "~/ui/nostr/article-conversation";

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return defaults;
  const { event, author } = loaderData;
  return articleMeta(event, author);
}

export const { loader, clientLoader } = createDualLoader(
  async (store, { params }: Route.MetaArgs) => {
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
  },
);

export default function Identifier({ loaderData }: Route.ComponentProps) {
  if (!loaderData?.event) return null;
  return (
    <div>
      <Article {...loaderData} />
      <ClientOnly>
        {() => <ArticleConversation event={loaderData.event} />}
      </ClientOnly>
    </div>
  );
}
