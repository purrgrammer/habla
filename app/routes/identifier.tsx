import type { Route } from "./+types/identifier";
import { kinds } from "nostr-tools";
import { default as clientStore } from "~/services/data.client";
import { default as serverStore } from "~/services/data.server";
import defaults, { articleMeta } from "~/seo";
import Article from "~/ui/nostr/article";
import { type DataStore } from "~/services/types";
import Debug from "~/ui/debug";
import { Card as CardSkeleton } from "~/ui/skeleton";
import { notFound } from "~/lib/http";

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return defaults;
  return articleMeta(loaderData.event, loaderData.profile || {});
}

async function loadData(store: DataStore, { params }: Route.MetaArgs) {
  const { username, identifier } = params;
  const users = await store.getUsers();
  const pointer = users.find((u) => u.username === username);
  if (pointer) {
    const pubkey = pointer.pubkey;
    try {
      const address = {
        kind: kinds.LongFormArticle,
        pubkey,
        identifier,
      };
      const [profile, event] = await Promise.all([
        store.fetchProfile(pointer),
        store.fetchAddress(address),
      ]);
      if (event) {
        return {
          pubkey,
          event,
          relays: [],
          profile,
          address,
        };
      }
      notFound();
    } catch (error) {
      notFound();
    }
  } else {
    notFound();
  }
}

export async function loader(args: Route.MetaArgs) {
  return loadData(serverStore, args);
}

export async function clientLoader(args: Route.MetaArgs) {
  return loadData(clientStore, args);
}

export default function Identifier({ loaderData }: Route.ComponentProps) {
  return loaderData ? <Article {...loaderData} /> : <CardSkeleton />;
}
