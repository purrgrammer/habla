import type { Route } from "./+types/identifier";
import { kinds } from "nostr-tools";
import { default as clientStore } from "~/services/data.client";
import { default as serverStore } from "~/services/data.server";
import defaults, { articleMeta } from "~/seo";
import Article from "~/ui/nostr/article";
import { type DataStore } from "~/services/types";
import Debug from "~/ui/debug";

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return defaults;
  return articleMeta(loaderData.event, loaderData.profile);
}

async function loadData(store: DataStore, { params }: Route.MetaArgs) {
  const { username, identifier } = params;
  const users = await store.getMembers();
  const pointer = users.find((u) => u.nip05 === username);
  if (pointer) {
    const pubkey = pointer.pubkey;
    const address = { kind: kinds.LongFormArticle, pubkey, identifier };
    const [profile, relays, event] = await Promise.all([
      store.fetchProfile(pointer),
      store.fetchRelays(pointer.pubkey),
      store.fetchAddress(address),
    ]);
    if (profile && event && relays) {
      return {
        pubkey,
        event,
        relays,
        profile,
        address,
      };
    }
  }
}

export async function loader(args: Route.MetaArgs) {
  return loadData(serverStore, args);
}

export async function clientLoader(args: Route.MetaArgs) {
  return loadData(clientStore, args);
}

export default function Identifier({
  loaderData,
  params,
}: Route.ComponentProps) {
  return loaderData?.profile ? (
    <Article {...loaderData} />
  ) : (
    <Debug>{{ loaderData, params }}</Debug>
  );
}
