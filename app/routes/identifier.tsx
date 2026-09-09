import type { Route } from "./+types/identifier";
import { kinds } from "nostr-tools";
import { default as clientStore } from "~/services/data";
import { default as serverStore } from "~/services/data.server";
import type { DataStore } from "~/services/types";
import { ssrDeadline } from "~/lib/ssr";
import { hydrateFromServer } from "~/lib/client-loader";
import defaults, { articleMeta } from "~/seo";
import Article from "~/ui/nostr/article";
import { Card as CardSkeleton } from "~/ui/skeleton";
import { notFound } from "~/lib/http";

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return defaults;
  return articleMeta(loaderData.event, loaderData.profile || {});
}

type LoadArgs = Pick<Route.LoaderArgs, "params">;

async function loadData(store: DataStore, { params }: LoadArgs) {
  const { username, identifier } = params;
  const users = await store.getMembers();
  const pointer = users.find((u) => u.nip05 === username);
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

export async function loader(args: Route.LoaderArgs) {
  return ssrDeadline("identifier", () => loadData(serverStore, args));
}

export const clientLoader = hydrateFromServer((args: Route.ClientLoaderArgs) =>
  loadData(clientStore, args),
);

export default function Identifier({ loaderData }: Route.ComponentProps) {
  return loaderData ? <Article {...loaderData} /> : <CardSkeleton />;
}
