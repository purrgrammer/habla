import type { Route } from "./+types/pubkey";
import { nip19 } from "nostr-tools";
import { default as clientStore } from "~/services/data";
import { default as serverStore } from "~/services/data.server";
import type { DataStore } from "~/services/types";
import { ssrDeadline } from "~/lib/ssr";
import { hydrateFromServer } from "~/lib/client-loader";
import defaults, { profileMeta } from "~/seo";
import Profile from "~/ui/nostr/profile";

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData || !loaderData.profile) return defaults;
  return profileMeta(loaderData.pubkey, loaderData.profile);
}

type LoadArgs = Pick<Route.LoaderArgs, "params">;

async function loadData(store: DataStore, { params }: LoadArgs) {
  const { nprofile } = params;
  const decoded = nip19.decode(nprofile);
  if (decoded?.type === "nprofile") {
    const { pubkey } = decoded.data;
    const pointer = decoded.data;
    const profile = await store.fetchProfile(pointer);
    if (profile) {
      return { pubkey, profile, pointer };
    }
  } else if (decoded?.type === "npub") {
    const pubkey = decoded.data;
    const pointer = { pubkey };
    const profile = await store.fetchProfile(pointer);
    if (profile) {
      return { pubkey, profile, pointer };
    }
  }
}

export async function loader(args: Route.LoaderArgs) {
  return ssrDeadline("pubkey", () => loadData(serverStore, args));
}

export const clientLoader = hydrateFromServer((args: Route.ClientLoaderArgs) =>
  loadData(clientStore, args),
);

export default function Pubkey({ loaderData, params }: Route.ComponentProps) {
  return loaderData ? <Profile {...loaderData} /> : null;
}
