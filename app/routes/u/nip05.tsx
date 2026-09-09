import type { Route } from "./+types/nip05";
import { queryProfile } from "nostr-tools/nip05";
import { default as clientStore } from "~/services/data";
import { default as serverStore } from "~/services/data.server";
import type { DataStore } from "~/services/types";
import { ssrDeadline } from "~/lib/ssr";
import { hydrateFromServer } from "~/lib/client-loader";
import Profile from "~/ui/nostr/profile";
import Debug from "~/ui/debug";
import defaults, { profileMeta } from "~/seo";

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return defaults;
  return profileMeta(loaderData.pubkey, loaderData.profile);
}

type LoadArgs = Pick<Route.LoaderArgs, "params">;

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

export async function loader(args: Route.LoaderArgs) {
  return ssrDeadline("u/nip05", () => loadData(serverStore, args));
}

export const clientLoader = hydrateFromServer((args: Route.ClientLoaderArgs) =>
  loadData(clientStore, args),
);

export default function Pubkey({ loaderData }: Route.ComponentProps) {
  return loaderData ? <Profile {...loaderData} /> : <Debug>{loaderData}</Debug>;
}
