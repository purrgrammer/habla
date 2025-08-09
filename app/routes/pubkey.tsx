import type { Route } from "./+types/pubkey";
import { nip19 } from "nostr-tools";
import { fetchProfile as clientFetchProfile } from "~/services/loaders.client";
import { fetchProfile as serverFetchProfile } from "~/services/loaders.server";
import { type Pubkey } from "~/types";
import defaults, { profileMeta } from "~/seo";
import Profile from "~/ui/nostr/profile";

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData || !loaderData.profile) return defaults;
  return profileMeta(loaderData.pubkey, loaderData.profile);
}

export async function loader({ params }: Route.MetaArgs) {
  const { nprofile } = params;
  const decoded = nip19.decode(nprofile);
  if (decoded?.type === "nprofile") {
    const pubkey = decoded.data.pubkey;
    const pointer = decoded.data;
    const profile = await serverFetchProfile(decoded.data);
    if (profile) {
      return { pubkey, profile, pointer };
    }
  } else if (decoded?.type === "npub") {
    const pubkey = decoded.data;
    const pointer = { pubkey };
    const profile = await serverFetchProfile(pointer);
    if (profile) {
      return { pubkey, profile, pointer };
    }
  }
}

export async function clientLoader({ params }: Route.MetaArgs) {
  const { nprofile } = params;
  const decoded = nip19.decode(nprofile);
  if (decoded?.type === "nprofile") {
    // TODO: relays
    const pubkey = decoded.data.pubkey;
    const pointer = decoded.data;
    const profile = await clientFetchProfile(decoded.data);
    if (profile) {
      return { pubkey, profile, pointer };
    }
  } else if (decoded?.type === "npub") {
    // TODO: relays
    const pubkey = decoded.data;
    const pointer = { pubkey };
    const profile = await clientFetchProfile(pointer);
    if (profile) {
      return { pubkey, profile, pointer };
    }
  }
}

export default function Pubkey({ loaderData, params }: Route.ComponentProps) {
  return loaderData ? <Profile {...loaderData} /> : null;
}
