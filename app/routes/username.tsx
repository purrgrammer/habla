import type { Route } from "./+types/username";
import { fetchProfile as clientFetchProfile } from "~/services/loaders.client";
import { fetchProfile as serverFetchProfile } from "~/services/loaders.server";
import { type Pubkey } from "~/types";
import defaults, { profileMeta } from "~/seo";
import Profile from "~/ui/nostr/profile";
import { getFeaturedUsers } from "~/featured";

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return defaults;
  return profileMeta(loaderData.pubkey, loaderData.profile);
}

export async function loader({ params }: Route.MetaArgs) {
  const { username } = params;
  const users = await getFeaturedUsers();
  const user = users.find((u) => u.nip05 === username);
  if (user) {
    const profile = await serverFetchProfile(user);
    if (profile) {
      return { pubkey: user.pubkey, profile, pointer: user };
    }
  }
}

export async function clientLoader({ params }: Route.MetaArgs) {
  const { username } = params;
  const users = await getFeaturedUsers();
  const user = users.find((u) => u.nip05 === username);
  if (user) {
    const profile = await clientFetchProfile(user);
    if (profile) {
      return { pubkey: user.pubkey, profile, pointer: user };
    }
  }
}

export default function Pubkey({ loaderData, params }: Route.ComponentProps) {
  return loaderData?.profile ? <Profile {...loaderData} /> : null;
}
