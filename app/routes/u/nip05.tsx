import type { Route } from "./+types/nip05";
import { queryProfile } from "nostr-tools/nip05";
import { createDualLoader } from "~/lib/route-loader";
import Profile from "~/ui/nostr/profile";
import Debug from "~/ui/debug";
import defaults, { profileMeta } from "~/seo";

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return defaults;
  return profileMeta(loaderData.pubkey, loaderData.profile);
}

export const { loader, clientLoader } = createDualLoader(
  async (store, { params }: Route.MetaArgs) => {
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
  },
);

export default function Pubkey({ loaderData }: Route.ComponentProps) {
  return loaderData ? <Profile {...loaderData} /> : <Debug>{loaderData}</Debug>;
}
