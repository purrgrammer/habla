import type { Route } from "./+types/username";
import { default as store } from "~/services/data";
import type { DataStore } from "~/services/types";
import { findMember } from "~/members";
import defaults, { profileMeta } from "~/seo";
import Profile from "~/ui/nostr/profile";

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return defaults;
  return profileMeta(loaderData.pubkey, loaderData.profile);
}

type LoadArgs = Pick<Route.ClientLoaderArgs, "params">;

async function loadData(store: DataStore, { params }: LoadArgs) {
  const { username } = params;
  const member = findMember(username);
  if (!member) return;
  const pointer = { pubkey: member.pubkey };
  const profile = await store.fetchProfile(pointer);
  if (profile) {
    return { username, pubkey: member.pubkey, profile, pointer };
  }
}

export async function clientLoader(args: Route.ClientLoaderArgs) {
  return loadData(store, args);
}

export default function Pubkey({ loaderData, params }: Route.ComponentProps) {
  return loaderData?.profile ? <Profile {...loaderData} /> : null;
}
