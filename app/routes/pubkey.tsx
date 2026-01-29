import type { Route } from "./+types/pubkey";
import { nip19 } from "nostr-tools";
import defaults, { profileMeta } from "~/seo";
import Profile from "~/ui/nostr/profile";
import { createDualLoader } from "~/lib/route-loader";

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData || !loaderData.profile) return defaults;
  return profileMeta(loaderData.pubkey, loaderData.profile);
}

export const { loader, clientLoader } = createDualLoader(
  async (store, { params }: Route.MetaArgs) => {
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
  },
);

export default function Pubkey({ loaderData, params }: Route.ComponentProps) {
  return loaderData ? <Profile {...loaderData} /> : null;
}
