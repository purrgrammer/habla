import { cn } from "~/lib/utils";
import {
  type ProfileContent,
  getDisplayName,
  getProfilePicture,
} from "applesauce-core/helpers";
import { Loading } from "~/ui/nostr/nip05";

export function Username({
  pubkey,
  profile,
  className,
}: {
  pubkey: string;
  profile?: ProfileContent;
  className?: string;
}) {
  const username = getDisplayName(profile) || pubkey.slice(0, 8);
  return <span className={cn("font-sans text-lg", className)}>{username}</span>;
}

export function Avatar({
  profile,
  className,
}: {
  profile?: ProfileContent;
  className?: string;
}) {
  const picture = getProfilePicture(profile) || "/favicon.ico";
  return (
    <img src={picture} className={cn("rounded-full object-cover", className)} />
  );
}

export default function User({
  pubkey,
  profile,
  className,
  img = "size-6",
  name,
  wrapper,
  withNip05,
  nip05,
}: {
  pubkey: string;
  profile?: ProfileContent;
  className?: string;
  img?: string;
  name?: string;
  wrapper?: string;
  withNip05?: boolean;
  nip05?: string;
}) {
  const username = getDisplayName(profile) || pubkey.slice(0, 8);
  const picture = getProfilePicture(profile) || "/favicon.ico";
  return (
    <div className={wrapper}>
      <div className={cn("flex flex-row items-center gap-2", className)}>
        <Avatar profile={profile} className={img} />
        <div className="flex flex-col gap-0">
          {profile?.nip05 && withNip05 ? (
            <Loading nip05={profile?.nip05} className={nip05} />
          ) : null}
          <Username pubkey={pubkey} profile={profile} className={name} />
        </div>
      </div>
    </div>
  );
}
