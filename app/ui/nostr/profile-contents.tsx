import { type ReactNode, useEffect, useState } from "react";
import { Link } from "react-router";
import {
  Server,
  Newspaper,
  Highlighter,
  CircleSlash2,
  HandHeart,
} from "lucide-react";
import { kinds, type NostrEvent, type Filter } from "nostr-tools";
import {
  getArticlePublished,
  getTagValue,
  type ProfileContent,
} from "applesauce-core/helpers";
import type { Pubkey } from "~/types";
import { useRelays } from "~/hooks/nostr";
import ArticleCard from "./article-card";
import Highlight from "./highlight";
import Timestamp from "../timestamp";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/ui/tabs";
import { BOOK } from "~/const";
import RelayLink from "./relay-link";
import Feed, { type FeedComponent } from "~/ui/nostr/feed";
//import ZapLeaderboard from "../zap-leaderboard";

const components: Record<number, FeedComponent> = {
  [kinds.Highlights]: ({ event, profile }) => {
    return (
      <Highlight
        noHeader
        key={event.id}
        blockquote="font-sans text-md font-light text-foreground leading-tight no-italic"
        link="break-all"
        event={event}
        profile={profile}
      />
    );
  },
  [BOOK]: ({ event, profile }) => {
    return (
      <div className="flex flex-col gap-1">
        <h3 className="text-md uppercase font-light text-muted-foreground">
          <Timestamp timestamp={getArticlePublished(event)} />
        </h3>
        <ArticleCard
          noHeader
          address={{
            kind: event.kind,
            pubkey: event.pubkey,
            identifier: getTagValue(event, "d") || "",
          }}
          article={event}
          author={profile}
        />
      </div>
    );
  },
  [kinds.LongFormArticle]: ({ event, profile }) => {
    return (
      <div className="flex flex-col gap-1">
        <h3 className="text-md uppercase font-light text-muted-foreground">
          <Timestamp timestamp={getArticlePublished(event)} />
        </h3>
        <ArticleCard
          noHeader
          address={{
            kind: event.kind,
            pubkey: event.pubkey,
            identifier: getTagValue(event, "d") || "",
          }}
          article={event}
          author={profile}
        />
      </div>
    );
  },
};

type ProfileTab = "articles" | "highlights" | "relays" | "books";

function Relays({ relays }: { relays: string[] }) {
  if (relays.length === 0) return null;
  return (
    <div className="flex flex-col gap-1">
      {relays.map((relay) => (
        <RelayLink key={relay} relay={relay} />
      ))}
    </div>
  );
}

export default function ProfileContents({
  pubkey,
  profile,
}: {
  pubkey: Pubkey;
  profile: ProfileContent;
}) {
  const icon = "text-muted-foreground";
  const relays = useRelays(pubkey);
  const [tab, setTab] = useState<ProfileTab>("articles");

  useEffect(() => {
    return () => setTab("articles");
  }, [pubkey]);

  return (
    <Tabs
      value={tab}
      onValueChange={(tab) => setTab(tab as ProfileTab)}
      className="w-full"
    >
      <TabsList className="my-4 w-full">
        <TabsTrigger value="articles">
          <Newspaper className={icon} />
          <span className="hidden sm:block">Articles</span>
        </TabsTrigger>
        <TabsTrigger value="highlights">
          <Highlighter className={icon} />
          <span className="hidden sm:block">Highlights</span>
        </TabsTrigger>
        {/*
        <TabsTrigger value="supporters">
          <HandHeart className={icon} />
          <span className="hidden sm:block">Supporters</span>
        </TabsTrigger>
        */}
        <TabsTrigger value="relays">
          <Server className={icon} />
          <span className="hidden sm:block">Relays</span>
        </TabsTrigger>
        {/*
        <TabsTrigger value="books">
          <Book className={icon} />
          Books
        </TabsTrigger>
        */}
      </TabsList>
      <TabsContent value="articles">
        {relays.length > 0 ? (
          <Feed
            id={`${pubkey}-articles`}
            profile={profile}
            relays={relays}
            filters={{
              authors: [pubkey],
              kinds: [kinds.LongFormArticle],
            }}
            components={components}
          />
        ) : null}
      </TabsContent>
      <TabsContent
        value="highlights"
        className="w-full flex items-center justify-center"
      >
        {relays.length > 0 ? (
          <Feed
            id={`${pubkey}-highlights`}
            profile={profile}
            relays={relays}
            filters={{
              authors: [pubkey],
              kinds: [kinds.Highlights],
            }}
            components={components}
            className="w-full md:grid-cols-1 gap-6 md:gap-8"
          />
        ) : null}
      </TabsContent>
      <TabsContent value="books">
        <Feed
          id="books"
          profile={profile}
          relays={relays}
          filters={{
            authors: [pubkey],
            kinds: [BOOK],
          }}
          components={components}
        />
      </TabsContent>
      <TabsContent value="relays">
        <Relays relays={relays} />
      </TabsContent>
      {/*
      <TabsContent value="supporters">
        <ZapLeaderboard pubkey={pubkey} />
      </TabsContent>
      */}
    </Tabs>
  );
}
