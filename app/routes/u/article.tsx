import type { Route } from "./+types/article";
import { kinds } from "nostr-tools";
import { queryProfile } from "nostr-tools/nip05";
import { default as store } from "~/services/data";
import type { DataStore } from "~/services/types";
import Article from "~/ui/nostr/article";
import defaults, { articleMeta } from "~/seo";

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return defaults;
  const { event, author } = loaderData;
  return articleMeta(event, author);
}

type LoadArgs = Pick<Route.ClientLoaderArgs, "params">;

async function loadData(store: DataStore, { params }: LoadArgs) {
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

export async function clientLoader(args: Route.ClientLoaderArgs) {
  return loadData(store, args);
}

export default function Identifier({ loaderData }: Route.ComponentProps) {
  if (!loaderData?.event) return null;
  return (
    <div>
      <Article {...loaderData} />
    </div>
  );
}
