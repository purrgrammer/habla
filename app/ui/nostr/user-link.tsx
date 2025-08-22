import { useMemo } from "react";
import { nip19 } from "nostr-tools";
import { type ProfileContent } from "applesauce-core/helpers";
import { Link } from "react-router";
import { cn } from "~/lib/utils";
import ClientOnly from "~/ui/client-only";
import ClientUserLink from "~/ui/nostr/user-link.client";
import { Avatar, Username } from "~/ui/nostr/user";
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

function ProfileLink({
  pubkey,
  relays,
  profile,
  className,
  img = "size-6",
  name,
  wrapper,
}: {
  pubkey: string;
  relays?: string[];
  profile?: ProfileContent;
  img?: string;
  name?: string;
  wrapper?: string;
  className?: string;
}) {
  const link = useUserLink(pubkey, relays);

  return profile ? (
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
        </div>
      </div>
    </div>
  ) : null;
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
  img?: string;
  name?: string;
  wrapper?: string;
  withNip05?: boolean;
  nip05?: string;
  className?: string;
}) {
  return (
    <ClientOnly
      fallback={
        <ProfileLink
          pubkey={pubkey}
          relays={relays}
          profile={profile}
          className={className}
          img={img}
          name={name}
          wrapper={wrapper}
        />
      }
    >
      {() => (
        <ClientUserLink
          withNip05={withNip05}
          nip05={nip05}
          pubkey={pubkey}
          relays={relays}
          profile={profile}
          img={img}
          name={name}
          wrapper={wrapper}
          className={className}
        />
      )}
    </ClientOnly>
  );
}
