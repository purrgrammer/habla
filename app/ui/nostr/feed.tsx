import { cn } from "~/lib/utils";
import { type ReactNode } from "react";
import { CircleSlash2 } from "lucide-react";
import { type NostrEvent, type Filter } from "nostr-tools";
import { type ProfileContent } from "applesauce-core/helpers";
import { useTimeline } from "~/hooks/nostr";
import { Card as SkeletonCard } from "../skeleton";
import Grid from "../grid";
import Debug from "../debug";

export interface FeedComponentProps {
  event: NostrEvent;
  profile?: ProfileContent;
}

export type FeedComponent = (props: FeedComponentProps) => ReactNode;

export function PureFeed({
  feed,
  profile,
  isLoading,
  components,
  className,
  showSeparator = false,
}: {
  feed?: NostrEvent[];
  profile?: ProfileContent;
  isLoading: boolean;
  components: Record<number, FeedComponent>;
  className?: string;
  showSeparator?: boolean;
}) {
  if (isLoading) {
    return <SkeletonCard />;
  }

  const isEmpty = feed ? feed?.length === 0 : true;
  if (isEmpty) {
    return (
      <div className="w-full border border-4 border-dotted rounded-sm h-32 flex flex-col gap-2 items-center justify-center">
        <CircleSlash2 className="text-muted-foreground" />
        <span className="font-light text-sm text-muted-foreground">
          Nothing found
        </span>
      </div>
    );
  }

  return (
    <Grid className={className}>
      {feed?.map((event, idx) => {
        const Component = components[event.kind];
        return Component ? (
          <>
            <Component key={event.id} event={event} profile={profile} />
            {showSeparator ? <hr /> : null}
          </>
        ) : (
          <Debug>{event}</Debug>
        );
      })}
      {isLoading ? <SkeletonCard /> : null}
    </Grid>
  );
}

export default function Feed({
  id,
  profile,
  relays,
  filters,
  components,
  className,
  showSeparator,
}: {
  id: string;
  profile?: ProfileContent;
  relays: string[];
  filters: Filter | Filter[];
  components: Record<number, FeedComponent>;
  className?: string;
  showSeparator?: boolean;
}) {
  const { timeline, isLoading } = useTimeline(id, filters, relays);
  return (
    <PureFeed
      profile={profile}
      feed={timeline}
      isLoading={isLoading}
      components={components}
      className={className}
      showSeparator={showSeparator}
    />
  );
}
