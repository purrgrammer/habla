import type { Route } from "./+types/nip05";
import { queryProfile } from "nostr-tools/nip05";
import { default as store } from "~/services/data";
import type { DataStore } from "~/services/types";
import Profile from "~/ui/nostr/profile";
import Debug from "~/ui/debug";
import defaults, { profileMeta } from "~/seo";

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return defaults;
  return profileMeta(loaderData.pubkey, loaderData.profile);
}

type LoadArgs = Pick<Route.ClientLoaderArgs, "params">;

async function loadData(store: DataStore, { params }: LoadArgs) {
  const { nip05 } = params;
  const pointer = await queryProfile(nip05);
  if (pointer) {
    const profile = await store.fetchProfile(pointer);
    if (profile) {
      return {
        pubkey: pointer.pubkey,
        pointer,
        profile,
      };
    }
  }
}

export async function clientLoader(args: Route.ClientLoaderArgs) {
  return loadData(store, args);
}

export default function Pubkey({ loaderData }: Route.ComponentProps) {
  return loaderData ? <Profile {...loaderData} /> : <Debug>{loaderData}</Debug>;
}
