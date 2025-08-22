import type { Route } from "./+types/username";
import { type Pubkey } from "~/types";
import defaults, { profileMeta } from "~/seo";
import Profile from "~/ui/nostr/profile";
import { type DataStore } from "~/services/types";
import { default as clientStore } from "~/services/data.client";
import { default as serverStore } from "~/services/data.server";

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return defaults;
  return profileMeta(loaderData.pubkey, loaderData.profile);
}

async function loadData(store: DataStore, { params }: Route.MetaArgs) {
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

export async function loader(args: Route.MetaArgs) {
  return loadData(serverStore, args);
}

export async function clientLoader(args: Route.MetaArgs) {
  return loadData(clientStore, args);
}

export default function Pubkey({ loaderData, params }: Route.ComponentProps) {
  return loaderData?.profile ? <Profile {...loaderData} /> : null;
}
