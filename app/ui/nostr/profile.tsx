import { Link } from "react-router";
import { Link as LinkIcon } from "lucide-react";
import { type ProfilePointer } from "nostr-tools/nip19";
import { type ProfileContent } from "applesauce-core/helpers";
import { Username, Avatar } from "~/ui/nostr/user";
import { type Pubkey } from "~/types";
import ProfileContents from "~/ui/nostr/profile-contents";
import ClientOnly from "~/ui/client-only";
import RichText from "./rich-text";
import { prettify } from "~/lib/url";
import { Card as SkeletonCard } from "~/ui/skeleton";
import Banner from "~/ui/banner";
import UserLink from "./user-link";

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
            <UserLink
              withNip05={true}
              pubkey={pubkey}
              profile={profile}
              img="hidden"
              name="text-4xl line-clamp-1"
            />
          </div>
        </div>
        <div className="px-4 pt-4 flex flex-col gap-3">
          {about ? (
            <ClientOnly
              fallback={<p className="text-md leading-tight">{about}</p>}
            >
              {() => (
                <p className="text-md leading-tight">
                  <RichText content={about} />
                </p>
              )}
            </ClientOnly>
          ) : null}
          {profile?.website ? (
            <Link
              target="_blank"
              className="flex flex-row items-center gap-1.5 text-md text-primary 
              line-clamp-1
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
