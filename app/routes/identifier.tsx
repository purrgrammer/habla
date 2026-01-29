import type { Route } from "./+types/identifier";
import { kinds } from "nostr-tools";
import { createDualLoader } from "~/lib/route-loader";
import defaults, { articleMeta } from "~/seo";
import Article from "~/ui/nostr/article";
import { Card as CardSkeleton } from "~/ui/skeleton";
import { notFound } from "~/lib/http";

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return defaults;
  return articleMeta(loaderData.event, loaderData.profile || {});
}

export const { loader, clientLoader } = createDualLoader(
  async (store, { params }: Route.MetaArgs) => {
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
  },
);

export default function Identifier({ loaderData }: Route.ComponentProps) {
  return loaderData ? <Article {...loaderData} /> : <CardSkeleton />;
}
