import type { Route } from "./+types/nip05";
import { queryProfile } from "nostr-tools/nip05";
import { fetchProfile as clientFetchProfile } from "~/services/loaders.client";
import { fetchProfile as serverFetchProfile } from "~/services/loaders.server";
import Profile from "~/ui/nostr/profile";
import Debug from "~/ui/debug";
import defaults, { profileMeta } from "~/seo";

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return defaults;
  return profileMeta(loaderData.pubkey, loaderData.profile);
}

export async function loader({ params }: Route.MetaArgs) {
  const { nip05 } = params;
  const pointer = await queryProfile(nip05);
  console.log("POINTA", { nip05, pointer });
  if (pointer) {
    const profile = await serverFetchProfile(pointer);
    if (profile) {
      return {
        pubkey: pointer.pubkey,
        pointer,
        profile,
      };
    }
  }
}

export async function clientLoader({ params }: Route.MetaArgs) {
  const { nip05 } = params;
  const pointer = await queryProfile(nip05);
  console.log("CLIENT.POINTA", { nip05, pointer });
  if (pointer) {
    const profile = await clientFetchProfile(pointer);
    if (profile) {
      return {
        pubkey: pointer.pubkey,
        pointer,
        profile,
      };
    }
  }
}

export default function Pubkey({ loaderData }: Route.ComponentProps) {
  return loaderData ? <Profile {...loaderData} /> : <Debug>{loaderData}</Debug>;
}
