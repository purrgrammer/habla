import type { Route } from "./+types/username";
import defaults, { profileMeta } from "~/seo";
import Profile from "~/ui/nostr/profile";
import { createDualLoader } from "~/lib/route-loader";

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return defaults;
  return profileMeta(loaderData.pubkey, loaderData.profile);
}

export const { loader, clientLoader } = createDualLoader(
  async (store, { params }: Route.MetaArgs) => {
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
  },
);

export default function Pubkey({ loaderData, params }: Route.ComponentProps) {
  return loaderData?.profile ? <Profile {...loaderData} /> : null;
}
