import type { Route } from "./+types/identifier";
import { kinds } from "nostr-tools";
import {
  fetchAddress as clientFetchAddress,
  fetchProfile as clientFetchProfile,
} from "~/services/loaders.client";
import {
  fetchAddress as serverFetchAddress,
  fetchProfile as serverFetchProfile,
} from "~/services/loaders.server";
import { type Pubkey } from "~/types";
import defaults, { articleMeta } from "~/seo";
import Article from "~/ui/nostr/article";
import { getFeaturedUsers } from "~/featured";

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return defaults;
  return articleMeta(loaderData.event, loaderData.profile);
}

export async function loader({ params }: Route.MetaArgs) {
  const { username, identifier } = params;
  const users = await getFeaturedUsers();
  const pointer = users.find((u) => u.nip05 === username);
  if (pointer) {
    const pubkey = pointer.pubkey;
    const address = { kind: kinds.LongFormArticle, pubkey, identifier };
    const [profile, event] = await Promise.all([
      serverFetchProfile(pointer),
      serverFetchAddress(address),
    ]);
    if (profile && event) {
      return {
        pubkey,
        event,
        profile,
        address,
      };
    }
  }
}

export async function clientLoader({ params }: Route.MetaArgs) {
  const { username, identifier } = params;
  const users = await getFeaturedUsers();
  const pointer = users.find((u) => u.nip05 === username);
  if (pointer) {
    const pubkey = pointer.pubkey;
    const address = { kind: kinds.LongFormArticle, pubkey, identifier };
    const [profile, event] = await Promise.all([
      clientFetchProfile(pointer),
      clientFetchAddress(address),
    ]);
    if (profile && event) {
      return {
        pubkey,
        event,
        profile,
        address,
      };
    }
  }
}

export default function Identifier({
  loaderData,
  params,
}: Route.ComponentProps) {
  return loaderData?.profile ? <Article {...loaderData} /> : null;
}
