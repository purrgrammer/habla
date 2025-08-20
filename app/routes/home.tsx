import { getTagValue } from "applesauce-core/helpers";
import { type NostrEvent } from "nostr-tools";
import {
  Sparkles,
  Glasses,
  Feather,
  Highlighter,
  HandCoins,
  Globe,
  Network,
  Bot,
  Apple,
  Users,
} from "lucide-react";
import type { Route } from "./+types/home";
import { getArticlesByCategory, getFeaturedHighlights } from "~/featured";
import defaults from "~/seo";
import ArticleCard from "~/ui/nostr/article-card";
import Highlight from "~/ui/nostr/highlight";
import Grid from "~/ui/grid";
import NostrCard from "~/ui/nostr/card";

export function meta({}: Route.MetaArgs) {
  return defaults;
}

export async function loader() {
  const categorizedArticles = await getArticlesByCategory();
  const highlights = await getFeaturedHighlights();
  return { categorizedArticles, highlights };
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

function CategorySection({
  title,
  icon,
  articles,
  iconColor = "text-orange-200 dark:text-orange-100",
}: {
  title: string;
  icon: React.ReactNode;
  articles: NostrEvent[];
  iconColor?: string;
}) {
  if (articles.length === 0) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-row items-center gap-2">
        <div className={`size-6 ${iconColor}`}>{icon}</div>
        <h3 className="text-2xl uppercase font-light">{title}</h3>
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
  const { categorizedArticles } = loaderData;
  return (
    <div className="py-12 pb-32 flex flex-col gap-24">
      <div className="flex flex-col gap-16 md:gap-64 md:flex-row items-center justify-between select-none">
        <Hero />
        <Features />
      </div>

      <CategorySection
        title="Social Media"
        icon={<Globe />}
        articles={categorizedArticles.socialMedia}
        iconColor="text-blue-500 dark:text-blue-400"
      />

      <CategorySection
        title="Nostr"
        icon={<Network />}
        articles={categorizedArticles.nostrTech}
        iconColor="text-purple-500 dark:text-purple-400"
      />

      <CategorySection
        title="Technology & AI"
        icon={<Bot />}
        articles={categorizedArticles.tech}
        iconColor="text-slate-600 dark:text-slate-400"
      />

      <CategorySection
        title="Health & Diet"
        icon={<Apple />}
        articles={categorizedArticles.health}
        iconColor="text-emerald-500 dark:text-emerald-400"
      />

      <CategorySection
        title="Society & Culture"
        icon={<Users />}
        articles={categorizedArticles.society}
        iconColor="text-amber-600 dark:text-amber-400"
      />

      <FeaturedHighlights {...loaderData} />
    </div>
  );
}
