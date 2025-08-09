import { useMemo } from "react";
import { cn } from "~/lib/utils";
import { Link } from "react-router";
import { nip19 } from "nostr-tools";
import { Avatar, Username } from "~/ui/nostr/user";
import { useProfile } from "~/hooks/nostr.client";
import { INDEX_RELAYS } from "~/const";
import Nip05 from "./nip05";

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
  img = "size-6",
  name,
  wrapper,
  withNip05,
  nip05,
}: {
  pubkey: string;
  relays?: string[];
  img?: string;
  name?: string;
  wrapper?: string;
  withNip05?: boolean;
  nip05?: string;
}) {
  const profile = useProfile(pubkey);
  const link = useUserLink(pubkey, relays);
  return (
    <div className={wrapper}>
      <div className="flex flex-row items-center gap-1">
        <Link to={link} className="flex-shrink-0">
          <Avatar
            profile={profile}
            className={cn(
              "mr-1 rounded-full object-cover inline-block flex-shrink-0",
              img,
            )}
          />
        </Link>
        <div className="flex flex-col gap-0">
          <Link to={link}>
            <Username
              pubkey={pubkey}
              profile={profile}
              className={cn(
                "font-sans text-lg hover:underline hover:decoration-dotted",
                name,
              )}
            />
          </Link>
          {withNip05 && profile?.nip05 ? (
            <Nip05 pubkey={pubkey} nip05={profile?.nip05} className={nip05} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
