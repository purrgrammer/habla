import { useMemo } from "react";
import { cn } from "~/lib/utils";
import { Link } from "react-router";
import { nip19 } from "nostr-tools";
import { Avatar, Username } from "~/ui/nostr/user";
import { useProfile, useRelays } from "~/hooks/nostr";
import { INDEX_RELAYS } from "~/const";
import { useUsers } from "~/nostr/queries";
import Nip05 from "./nip05";
import type { ProfileContent } from "applesauce-core/helpers";

function useUserLink(pubkey: string, relays?: string[]) {
  const { data: users } = useUsers();
  const user = users?.find((u) => u.pubkey === pubkey);
  const nprofile = useMemo(() => {
    if (relays) {
      return nip19.nprofileEncode({ pubkey, relays });
    } else {
      return nip19.nprofileEncode({ pubkey, relays: INDEX_RELAYS });
    }
  }, [pubkey, relays]);
  if (user) {
    return `/${user.username}`;
  }
  return `/p/${nprofile}`;
}

function PureUserLink({
  pubkey,
  img = "size-6",
  name,
  wrapper,
  withNip05,
  nip05,
  profile,
  className,
}: {
  pubkey: string;
  relays?: string[];
  img?: string;
  name?: string;
  wrapper?: string;
  withNip05?: boolean;
  nip05?: string;
  profile?: ProfileContent;
  className?: string;
}) {
  const relays = useRelays(pubkey);
  const link = useUserLink(pubkey, relays);
  return (
    <div className={wrapper}>
      <div className={cn("flex flex-row items-center gap-1", className)}>
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

function FetchUserLink(props: {
  pubkey: string;
  relays?: string[];
  img?: string;
  name?: string;
  wrapper?: string;
  withNip05?: boolean;
  nip05?: string;
}) {
  const profile = useProfile(props.pubkey);
  return <PureUserLink {...props} profile={profile} />;
}

export default function UserLink({
  profile,
  ...props
}: {
  pubkey: string;
  relays?: string[];
  img?: string;
  name?: string;
  wrapper?: string;
  withNip05?: boolean;
  nip05?: string;
  profile?: ProfileContent;
  className?: string;
}) {
  return profile ? (
    <PureUserLink {...props} profile={profile} />
  ) : (
    <FetchUserLink {...props} />
  );
}
