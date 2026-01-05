import type { Route } from "./+types/address";
import { kinds, nip19 } from "nostr-tools";
import { default as clientStore } from "~/services/data";
import { default as serverStore } from "~/services/data.server";
import Article from "~/ui/nostr/article";
import defaults, { articleMeta } from "~/seo";
import type { DataStore } from "~/services/types";
import Debug from "~/ui/debug";

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return defaults;
  const { event, author } = loaderData;
  if (event.kind === kinds.LongFormArticle) {
    return articleMeta(event, author);
  }
  return defaults;
}

async function loadData(store: DataStore, { params }: Route.MetaArgs) {
  const { naddr } = params;
  const decoded = nip19.decode(naddr);
  if (decoded?.type === "naddr") {
    const relays = await store.fetchRelays(decoded.data.pubkey);
    const [author, event] = await Promise.all([
      store.fetchProfile({ pubkey: decoded.data.pubkey, relays }),
      store.fetchAddress(decoded.data),
    ]);
    if (author && event) {
      return { author, event, relays, address: decoded.data };
    }
  }
}

export async function loader(args: Route.MetaArgs) {
  return loadData(serverStore, args);
}

export async function clientLoader(args: Route.MetaArgs) {
  return loadData(clientStore, args);
}

const components: Record<number, any> = {
  [kinds.LongFormArticle]: Article,
  //[kinds.BookmarkList]: BookmarksList,
  //[kinds.Bookmarksets]: BookmarksSet,
};

export default function Address(props: Route.ComponentProps) {
  if (!props?.loaderData) return null;
  const Component = components[props.loaderData.address.kind];
  return Component ? (
    <Component {...props.loaderData} />
  ) : (
    <Debug>{props.loaderData}</Debug>
  );
}
