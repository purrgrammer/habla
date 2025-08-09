import { Link } from "react-router";
import { Link as LinkIcon } from "lucide-react";
import { type ProfilePointer } from "nostr-tools/nip19";
import { type ProfileContent } from "applesauce-core/helpers";
import { Username, Avatar } from "~/ui/nostr/user";
import { type Pubkey } from "~/types";
import ProfileContents from "~/ui/nostr/profile-contents.client";
import ClientOnly from "~/ui/client-only";
import RichText from "./rich-text";
import { prettify } from "~/lib/url";
import { Card as SkeletonCard } from "~/ui/skeleton";
import Banner from "~/ui/banner";
import Nip05 from "./nip05";
import { Loading as LoadingNip05 } from "./pure-nip05";

export default function Profile({
  pubkey,
  profile,
}: {
  pointer?: ProfilePointer;
  pubkey: Pubkey;
  profile: ProfileContent;
}) {
  const banner = profile.banner;
  const about = profile.about;
  return (
    <div className="flex flex-col p-0 gap-2 flex-1 w-full">
      <div className="flex flex-col p-0 flex-1">
        <Banner src={banner} />
        <div className="ml-2 flex flex-col items-start px-2 gap-0">
          <Avatar
            className="border bg-background border-4 border-background size-32"
            profile={profile}
          />
          <div className="flex flex-col gap-0">
            <Username
              pubkey={pubkey}
              profile={profile}
              className="text-4xl line-clamp-1"
            />
            {profile?.nip05 ? (
              <ClientOnly fallback={<LoadingNip05 nip05={profile.nip05} />}>
                {() => <Nip05 pubkey={pubkey} nip05={profile.nip05!} />}
              </ClientOnly>
            ) : null}
          </div>
        </div>
        <div className="px-4 pt-4 flex flex-col gap-3">
          {about ? (
            <ClientOnly
              fallback={<p className="text-md leading-tight">{about}</p>}
            >
              {() => <RichText content={about} />}
            </ClientOnly>
          ) : null}
          {profile?.website ? (
            <Link
              target="_blank"
              className="flex flex-row items-center gap-1.5 text-md text-primary 
              break-all
              hover:underline hover:decoration-dotted"
              to={profile.website}
            >
              <LinkIcon className="size-3 flex-shrink-0 text-muted-foreground" />
              {prettify(profile.website)}
            </Link>
          ) : null}
        </div>
      </div>
      <ClientOnly fallback={<SkeletonCard className="my-4" />}>
        {() => <ProfileContents pubkey={pubkey} profile={profile} />}
      </ClientOnly>
    </div>
  );
}
