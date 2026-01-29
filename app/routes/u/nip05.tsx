import type { Route } from "./+types/nip05";
import { queryProfile } from "nostr-tools/nip05";
import { clientStore, serverStore, type DataStore } from "~/lib/route-loader";
import Profile from "~/ui/nostr/profile";
import Debug from "~/ui/debug";
import defaults, { profileMeta } from "~/seo";

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return defaults;
  return profileMeta(loaderData.pubkey, loaderData.profile);
}

async function loadData(store: DataStore, { params }: Route.MetaArgs) {
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

export async function loader(args: Route.MetaArgs) {
  return loadData(serverStore, args);
}

export async function clientLoader(args: Route.MetaArgs) {
  return loadData(clientStore, args);
}

export default function Pubkey({ loaderData }: Route.ComponentProps) {
  return loaderData ? <Profile {...loaderData} /> : <Debug>{loaderData}</Debug>;
}
