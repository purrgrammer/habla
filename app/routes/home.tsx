import { getTagValue } from "applesauce-core/helpers";
import { type NostrEvent } from "nostr-tools";
import {
  Sparkles,
  Glasses,
  Feather,
  Highlighter,
  HandCoins,
} from "lucide-react";
import type { Route } from "./+types/home";
import { getFeaturedArticles, getFeaturedHighlights } from "~/featured";
import defaults from "~/seo";
import ArticleCard from "~/ui/nostr/article-card";
import Highlight from "~/ui/nostr/highlight";
import Grid from "~/ui/grid";
import NostrCard from "~/ui/nostr/card";

export function meta({}: Route.MetaArgs) {
  return defaults;
}

export async function loader() {
  const articles = await getFeaturedArticles();
  const highlights = await getFeaturedHighlights();
  return { articles, highlights };
}

function Hero() {
  return (
    <div className="flex flex-col gap-0 py-12">
      <h1 className="font-serif font-light text-7xl">Habla</h1>
      <h2 className="text-md text-muted-foreground leading-tight">
        lat. <span className="italic">fabŭla</span>
      </h2>
      <ol className="flex flex-col gap-1 marker:text-muted-foreground marker:text-md font-sans text-lg font-light list-decimal list-inside ml-2 mt-4">
        <li>Faculty of speech</li>
        <li>Act of speaking</li>
        <li>Language</li>
      </ol>
    </div>
  );
}

function Features() {
  const li = "flex flex-row-reverse items-center gap-2 font-serif text-4xl";
  const liReverse = li;
  const icon = "size-8 text-muted-foreground";
  return (
    <ul className="flex flex-col items-end gap-0.5 list-style-none">
      <li className={li}>
        <Glasses className={icon} />
        <span className="font-sans font-light">read</span>
      </li>
      <li className={liReverse}>
        <Highlighter className={icon} />
        <mark className="italic font-sans font-light bg-orange-200 dark:bg-orange-300">
          highlight
        </mark>
      </li>
      <li className={li}>
        <Feather className={icon} />
        <span className="font-sans font-light">write</span>
      </li>
      <li className={liReverse}>
        <HandCoins className={icon} />
        <span className="font-sans font-light underline decoration-dotted decoration-orange-300">
          earn
        </span>
      </li>
    </ul>
  );
}

function FeaturedArticles({ articles }: { articles: NostrEvent[] }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-row items-center gap-2">
        <Sparkles className="size-6 text-orange-200 dark:text-orange-100" />
        <h3 className="text-2xl uppercase font-light">Featured</h3>
      </div>
      <Grid>
        {articles.map((article) => (
          <ArticleCard
            key={article.id}
            article={article}
            address={{
              kind: article.kind,
              pubkey: article.pubkey,
              identifier: getTagValue(article, "d") || "",
            }}
          />
        ))}
      </Grid>
    </div>
  );
}

function FeaturedHighlights({ highlights }: { highlights: NostrEvent[] }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-row items-center gap-2">
        <Highlighter className="size-6 text-orange-200 dark:text-orange-100" />
        <h3 className="text-2xl uppercase font-light">Highlights</h3>
      </div>
      <Grid className="md:grid-cols-1">
        {highlights.map((event) => (
          <NostrCard
            className="border-none"
            noFooter
            key={event.id}
            event={event}
          >
            <Highlight noHeader event={event} />
          </NostrCard>
        ))}
      </Grid>
    </div>
  );
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { articles } = loaderData;
  return (
    <div className="py-12 pb-32 flex flex-col gap-24">
      <div className="flex flex-col gap-16 md:gap-64 md:flex-row items-center justify-between select-none">
        <Hero />
        <Features />
      </div>
      <FeaturedArticles {...loaderData} />
      <FeaturedHighlights {...loaderData} />
    </div>
  );
}
