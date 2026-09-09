import type { Route } from "./+types/username";
import { default as clientStore } from "~/services/data";
import { default as serverStore } from "~/services/data.server";
import type { DataStore } from "~/services/types";
import { ssrDeadline } from "~/lib/ssr";
import { hydrateFromServer } from "~/lib/client-loader";
import defaults, { profileMeta } from "~/seo";
import Profile from "~/ui/nostr/profile";

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return defaults;
  return profileMeta(loaderData.pubkey, loaderData.profile);
}

type LoadArgs = Pick<Route.LoaderArgs, "params">;

async function loadData(store: DataStore, { params }: LoadArgs) {
  const { username } = params;
  const users = await store.getUsers();
  const user = users.find((u) => u.username === username);
  if (user) {
    const profile = await store.fetchProfile(user);
    if (profile) {
      return {
        username,
        pubkey: user.pubkey,
        profile,
        pointer: user,
      };
    }
  }
}

export async function loader(args: Route.LoaderArgs) {
  return ssrDeadline("username", () => loadData(serverStore, args));
}

export const clientLoader = hydrateFromServer((args: Route.ClientLoaderArgs) =>
  loadData(clientStore, args),
);

export default function Pubkey({ loaderData, params }: Route.ComponentProps) {
  return loaderData?.profile ? <Profile {...loaderData} /> : null;
}
