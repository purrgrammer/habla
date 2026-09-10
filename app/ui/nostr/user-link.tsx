import { useMemo } from "react";
import { cn } from "~/lib/utils";
import { Link } from "react-router";
import { nip19 } from "nostr-tools";
import { Avatar, Username } from "~/ui/nostr/user";
import { useProfile, useRelays } from "~/hooks/nostr";
import { INDEX_RELAYS } from "~/const";
import Nip05 from "./nip05";
import type { ProfileContent } from "applesauce-core/helpers";

/** Everyone is addressed by nprofile; Habla issues no vanity URLs. */
function useUserLink(pubkey: string, relays?: string[]) {
  const nprofile = useMemo(
    () => nip19.nprofileEncode({ pubkey, relays: relays ?? INDEX_RELAYS }),
    [pubkey, relays],
  );
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
  // `img="hidden"` is how a caller asks for the name alone. Hiding the avatar
  // is not enough: its <Link> stayed in the flex row as a 0x0 item and still
  // took a `gap-1`, which showed up as a stray space before the name.
  const showAvatar = !img?.split(/\s+/).includes("hidden");
  // Spans, not divs. Callers pass `wrapper="inline"` / `"inline-block"` because
  // this is rendered mid-sentence — inside a react-markdown <p> for a `nostr:`
  // mention, and inside RichText — and a <div> there is illegal, which the
  // browser fixes by closing the paragraph early. `block` keeps the default for
  // the callers that pass no wrapper at all; `cn` is tailwind-merge, so an
  // explicit inline wrapper still wins.
  return (
    <span className={cn("block", wrapper)}>
      <span className={cn("flex flex-row items-center gap-1", className)}>
        {showAvatar ? (
          <Link to={link} className="flex-shrink-0">
            <Avatar
              profile={profile}
              className={cn(
                "mr-1 rounded-full object-cover inline-block flex-shrink-0",
                img,
              )}
            />
          </Link>
        ) : null}
        <span className="flex flex-col gap-0">
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
        </span>
      </span>
    </span>
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
