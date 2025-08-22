import { useState } from "react";
import { normalizeURL } from "nostr-tools/utils";
import { kinds } from "nostr-tools";
import Feed, { type FeedComponent } from "~/ui/nostr/feed.client";
import { Newspaper, Highlighter, Server } from "lucide-react";
import Highlight from "./highlight";
import { PureArticleCard } from "./article-card";
import { ToggleGroup, ToggleGroupItem } from "~/ui/toggle-group";
import { getTagValue, isSafeRelayURL } from "applesauce-core/helpers";
import NostrCard from "./card";
import { useRelayInfo } from "~/nostr/queries";
import Banner from "../banner";
import ComingSoon from "../coming-soon";

const components: Record<number, FeedComponent> = {
  [kinds.Highlights]: ({ event, profile }) => {
    return (
      <NostrCard
        //noFooter
        key={event.id}
        event={event}
        className="border-none bg-transparent"
      >
        <Highlight
          noHeader
          blockquote="font-sans text-md font-light text-foreground leading-tight no-italic"
          link="break-all"
          event={event}
          profile={profile}
        />
      </NostrCard>
    );
  },
  [kinds.LongFormArticle]: ({ event, profile }) => {
    return (
      <NostrCard
        //noFooter
        key={event.id}
        event={event}
        className="border-none bg-transparent"
      >
        <PureArticleCard
          address={{
            kind: event.kind,
            pubkey: event.pubkey,
            identifier: getTagValue(event, "d") || "",
          }}
          article={event}
        />
      </NostrCard>
    );
  },
};

function UnsafeRelayFeed({ relay }: { relay: string }) {
  return null;
}

function SafeRelayFeed({ relay }: { relay: string }) {
  const { data: info } = useRelayInfo(relay);
  const [values, setValues] = useState(["articles", "highlights"]);
  const filters =
    values.length === 0
      ? {
          kinds: [kinds.LongFormArticle, kinds.Highlights],
        }
      : {
          kinds: [
            ...(values.includes("articles") ? [kinds.LongFormArticle] : []),
            ...(values.includes("highlights") ? [kinds.Highlights] : []),
          ],
        };

  function onValueChange(newValues: string[]) {
    setValues(newValues);
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-col gap-2 w-full">
        <div className="flex flex-col gap-1">
          <Banner negativeMargin={false} src={info?.icon} />
          <h1 className="text-4xl line-clamp-1">{info?.name}</h1>
        </div>
        <p className="text-md text-muted-foreground leading-tight">
          {info?.description}
        </p>
      </div>
      <ToggleGroup
        className="gap-2"
        value={values}
        onValueChange={onValueChange}
        type="multiple"
      >
        <ToggleGroupItem value="articles" className="rounded-sm px-3">
          <Newspaper className="text-muted-foreground" />
          Articles
        </ToggleGroupItem>
        <ToggleGroupItem value="highlights" className="rounded-sm px-3">
          <Highlighter className="text-muted-foreground" />
          Highlights
        </ToggleGroupItem>
      </ToggleGroup>
      <Feed
        showSeparator
        id={values.join("-")}
        relays={[relay]}
        filters={filters}
        components={components}
        className="border rounded-sm gap-0 grid-cols-1 md:grid-cols-1 md:gap-0"
      />
    </div>
  );
}

export default function RelayFeed({ relay }: { relay: string }) {
  const isSafe = isSafeRelayURL(relay);
  const relayUrl = normalizeURL(relay);
  if (isSafe) return <SafeRelayFeed relay={relayUrl} />;
  return <UnsafeRelayFeed relay={relayUrl} />;
}
