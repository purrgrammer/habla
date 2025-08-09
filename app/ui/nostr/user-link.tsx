import { useMemo } from "react";
import { Link } from "react-router";
import { nip19 } from "nostr-tools";
import { type ProfileContent } from "applesauce-core/helpers";
import User from "~/ui/nostr/user";
import ClientOnly from "~/ui/client-only";
import ClientUserLink from "~/ui/nostr/user-link.client";
import { INDEX_RELAYS } from "~/const";

function useUserLink(pubkey: string, relays?: string[]) {
  const nprofile = useMemo(() => {
    if (relays) {
      return nip19.nprofileEncode({ pubkey, relays });
    } else {
      return nip19.nprofileEncode({ pubkey, relays: INDEX_RELAYS });
    }
  }, [pubkey, relays]);
  return `/p/${nprofile}`;
}

export default function UserLink({
  pubkey,
  relays,
  profile,
  className,
  img,
  name,
  wrapper,
  withNip05,
  nip05,
}: {
  pubkey: string;
  relays?: string[];
  profile?: ProfileContent;
  className?: string;
  img?: string;
  name?: string;
  wrapper?: string;
  withNip05?: boolean;
  nip05?: string;
}) {
  const link = useUserLink(pubkey, relays);
  return (
    <ClientOnly>
      {() => (
        <ClientUserLink
          withNip05={withNip05}
          nip05={nip05}
          pubkey={pubkey}
          img={img}
          name={name}
          wrapper={wrapper}
        />
      )}
    </ClientOnly>
  );
}
