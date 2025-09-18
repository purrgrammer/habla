import { useMemo, type ReactNode } from "react";
import { Link } from "react-router";
import { getTagValue } from "applesauce-core/helpers";
import { type NostrEvent } from "nostr-tools";
import {
  Sprout,
  HandFist,
  Link as LinkIcon,
  Glasses,
  Feather,
  Highlighter,
  HandCoins,
  Globe,
  Network,
  Bot,
  Apple,
  HeartHandshake,
  AtSign,
  Bookmark,
  Heart,
  Search,
  Code,
  ShieldCheck,
  Speech,
  EyeOff,
  Brush,
  HandHeart,
} from "lucide-react";
import type { Route } from "./+types/home";
import {
  faq,
  features,
  getArticlesByCategory,
  getFeaturedArticles,
  getFeaturedHighlights,
  testimonials,
} from "~/featured";
import defaults from "~/seo";
import ArticleCard from "~/ui/nostr/article-card";
import { PureHighlight } from "~/ui/nostr/highlight";
import Grid from "~/ui/grid";
import NostrCard from "~/ui/nostr/card";
import { type DataStore, type User } from "~/services/types";
import { default as serverStore } from "~/services/data.server";
import { default as clientStore } from "~/services/data.client";
import { Button } from "~/ui/button";
import { Badge } from "~/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/ui/card";
import { FiatAmount } from "~/ui/currency.client";
import SatsAmount from "~/ui/sats";
import ClientOnly from "~/ui/client-only";
import Logo from "~/ui/logo";
import { cn } from "~/lib/utils";
import { TagCloud } from "~/ui/tag-cloud";
import { parseZap, useProfileZaps, type Zap } from "~/hooks/nostr.client";
import { HABLA_PUBKEY, HABLA_REPO_URL } from "~/const";
import { ZapPill } from "~/ui/zaps.client";
import Donate from "~/ui/donate";
import Note from "~/ui/nostr/note";
import Blockquote from "~/ui/blockquote";
import UserLink from "~/ui/nostr/user-link";

export function meta({}: Route.MetaArgs) {
  return defaults;
}

export async function loadData(store: DataStore) {
  const featured = await store.getUsers();
  const categorizedArticles = await getArticlesByCategory();
  const articles = await getFeaturedArticles();
  const highlights = await getFeaturedHighlights();
  return { featured, articles, categorizedArticles, highlights };
}

export async function loader() {
  return loadData(serverStore);
}

export async function clientLoader() {
  return loadData(clientStore);
}
//clientLoader.hydrate = true as const;

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
        <span className="font-sans font-light">Read</span>
      </li>
      <li className={liReverse}>
        <Highlighter className={icon} />
        <mark className="italic font-sans font-light bg-orange-200 dark:bg-orange-300">
          Highlight
        </mark>
      </li>
      <li className={li}>
        <Feather className={icon} />
        <span className="font-sans font-light">Write</span>
      </li>
      <li className={li}>
        <Bookmark className={icon} />
        <span className="font-sans font-light">Bookmark</span>
      </li>
      <li className={li}>
        <HandCoins className={icon} />
        <span className="font-sans font-light underline decoration-dotted decoration-orange-300">
          Earn
        </span>
      </li>
    </ul>
  );
}

function Testimonials() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-row items-center gap-2">
        <Speech className="size-6 text-muted-foreground" />
        <h3 className="text-2xl uppercase font-light">Testimonials</h3>
      </div>
      <p>What people are saying about us</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center sm:gap-8 w-full">
        {testimonials
          .sort((a, b) => b.created_at - a.created_at)
          .map((ev) => {
            return (
              <div className="flex flex-col gap-2 p-2 flex-1 items-center justify-center w-full">
                <Blockquote
                  text={ev.content
                    .replace(/nostr:nevent[^\s]+/g, "")
                    .trim()
                    .replace(/:$/, "")}
                  className="w-full"
                />
                <UserLink
                  pubkey={ev.pubkey}
                  wrapper="w-full flex-col gap-2"
                  img="size-8"
                  name="text-lg"
                />
              </div>
            );
          })}
      </div>
    </div>
  );
}

function Donations() {
  const { timeline } = useProfileZaps(HABLA_PUBKEY);
  const zaps = timeline?.map((ev) => parseZap(ev)).filter(Boolean) as Zap[];
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-row items-center gap-2">
        <HandHeart className="size-6 text-muted-foreground" />
        <h3 className="text-2xl uppercase font-light">Donations</h3>
      </div>
      <p>
        Habla is a free,{" "}
        <Link
          target="_blank"
          className="hover:underline decoration-dotted text-primary"
          to={HABLA_REPO_URL}
        >
          open-source
        </Link>{" "}
        tool for reading, writing, <mark>highlighting</mark>, bookmarking and
        earning.
      </p>
      <div className="flex flex-row flex-wrap gap-2">
        {zaps
          ?.sort((a, b) => b.amount - a.amount)
          .map((zap) => {
            return <ZapPill key={zap.id} zap={zap} />;
          })}
      </div>
      <Donate />
    </div>
  );
}

function CategorySection({
  title,
  icon,
  articles,
  featured,
  iconColor = "text-orange-200 dark:text-orange-100",
}: {
  title: string;
  icon: React.ReactNode;
  articles: NostrEvent[];
  featured: User[];
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
            author={featured.find((u) => u.pubkey === article.pubkey)?.profile}
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
            <PureHighlight event={event} />
          </NostrCard>
        ))}
      </Grid>
    </div>
  );
}

// patreon features:
// - nip05 and vanity URL
// - featured on the home page

// premium features:
// - relay soon

// pro features:
// - priority support
// - analytics

type Icon = any;

type Feature = {
  icon: Icon;
  text: ReactNode;
  soon?: boolean;
};

type Tier = {
  id: string;
  soon?: boolean;
  icon: Icon;
  description: string;
  title: string;
  features: Feature[];
  price: number;
};

const tiers: Tier[] = [
  {
    id: "sprout",
    description:
      "Get a username, nostr address and an indexed profile, highlights and articles. One time pay.",
    title: "Sprout",
    icon: Sprout,
    price: 21_000,
    features: [
      {
        icon: Logo,
        text: "Featured on the home page",
      },
      {
        icon: AtSign,
        text: "nostr address",
      },
      {
        icon: LinkIcon,
        text: "habla.news/username page",
      },
      {
        icon: Search,
        text: "SEO for your content",
      },
    ],
  },
  //{
  //  id: "sprout",
  //  description:
  //    "Get a username, nostr address and an indexed profile, highlights and articles. One time pay.",
  //  title: "Sprout",
  //  icon: Sprout,
  //  price: 21_000,
  //  features: [
  //    {
  //      icon: Logo,
  //      text: "Featured on the home page",
  //    },
  //    {
  //      icon: AtSign,
  //      text: "nostr address",
  //    },
  //    {
  //      icon: LinkIcon,
  //      text: "habla.news/username page",
  //    },
  //    {
  //      icon: Search,
  //      text: "SEO for your content",
  //    },
  //    {
  //      icon: ChartColumnStacked,
  //      text: "Nostr analytics",
  //      soon: true,
  //    },
  //  ],
  //},
  //{
  //  id: "tree",
  //  description:
  //    "Get everything in Sprout and much more: a media server and network & page view analytics. Billed yearly.",
  //  title: "Tree",
  //  icon: TreeDeciduous,
  //  price: 100_000,
  //  soon: true,
  //  features: [
  //    {
  //      icon: Sprout,
  //      text: "everything in Sprout",
  //    },
  //    {
  //      icon: Server,
  //      text: "High availability relay",
  //    },
  //    {
  //      icon: HardDriveUpload,
  //      text: "Media Server",
  //    },
  //    {
  //      icon: ChartSpline,
  //      text: "Page view insights",
  //    },
  //    {
  //      icon: Award,
  //      text: "Badge",
  //    },
  //  ],
  //},
];

function TierCard(tier: Tier) {
  return (
    <Card className={tier.soon ? "opacity-60" : ""}>
      <CardHeader>
        <div className="flex flex-row items-center justify-between">
          <div className="flex flex-row items-center gap-1">
            <tier.icon className="size-9 text-muted-foreground" />
            <CardTitle className="text-4xl">{tier.title}</CardTitle>
          </div>
          {tier.soon ? (
            <Badge variant="secondary" className="uppercase">
              soon
            </Badge>
          ) : null}
        </div>
        <CardDescription className="text-md">
          {tier.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="my-4">
              <div className="flex flex-col items-center justify-center">
                <SatsAmount amount={tier.price} size="xl" />
                <ClientOnly
                  fallback={
                    <SatsAmount
                      className="text-muted-foreground"
                      amount={tier.price}
                      currency="BTC"
                    />
                  }
                >
                  {() => (
                    <>
                      <FiatAmount
                        className="text-muted-foreground"
                        amount={tier.price}
                        currency="USD"
                      />
                    </>
                  )}
                </ClientOnly>
              </div>
            </div>
            <Button disabled={tier.soon} variant="default" size="lg">
              <HandCoins />
              Contribute
            </Button>
          </div>
          <hr />
          <ol className="">
            {tier.features.map((f, index) => (
              <li key={index}>
                <div
                  className={cn(
                    "flex flex-row items-center gap-2",
                    f.soon ? "opacity-60" : "",
                  )}
                >
                  <f.icon className="size-5 text-muted-foreground" />
                  <span className="text-lg">{f.text}</span>
                  {f.soon ? <Badge variant="secondary">soon</Badge> : null}
                </div>
              </li>
            ))}
          </ol>
          <hr />
        </div>
      </CardContent>
    </Card>
  );
}

function JoinNow() {
  return (
    <div id="join-now" className="flex flex-col gap-6">
      <div className="flex flex-row items-center gap-2">
        <HandFist className="size-6 text-primary" />
        <h3 className="text-2xl uppercase font-light">Support the project</h3>
      </div>
      <p className="text-lg">
        Your contributions go towards funding the Habla development team and you
        get some perks in exchange.
      </p>
      <Grid>
        {tiers.map((tier) => (
          <TierCard key={tier.id} {...tier} />
        ))}
      </Grid>
    </div>
  );
}

function FeaturedYou() {
  return (
    <div className="flex flex-col gap-2 items-center justify-center">
      <img src="/favicon.ico" className="size-24 rounded-full object-cover" />
      <div className="flex flex-col gap-0 items-center justify-center">
        <h3 className="font-sans text-2xl line-clamp-1">You</h3>
        <div className="flex flex-row items-center gap-1">
          <Logo className="size-4 text-muted-foreground" />
          <h4 className="font-sans text-md line-clamp-1">username</h4>
        </div>
      </div>
    </div>
  );
}

function FeaturedUser({ user }: { user: User }) {
  return (
    <Link
      className="flex flex-col gap-2 p-2 items-center justify-center"
      to={user.username}
    >
      <img
        src={user.profile.picture || "/favicon.ico"}
        className="size-18 sm:size-24 rounded-full object-cover"
      />
      <div className="flex flex-col gap-0 items-center justify-center">
        <h3 className="font-sans text-2xl line-clamp-1">
          {user.profile.display_name || user.profile.name}
        </h3>
        <div className="flex flex-row items-center gap-1">
          <Logo className="size-4 text-muted-foreground" />
          <h4 className="font-sans text-md line-clamp-1">{user.username}</h4>
        </div>
      </div>
    </Link>
  );
}

const values = [
  {
    icon: Speech,
    text: "Free Speech",
  },
  {
    icon: Code,
    text: "Open Source",
  },
  {
    icon: ShieldCheck,
    text: "Ad-Free",
  },
  {
    icon: EyeOff,
    text: "No tracking",
  },
];

function Values() {
  return (
    <Grid className="w-full p-2 gap-4 grid-cols-2 md:grid-cols-2">
      {values.map((f, index) => (
        <div key={index}>
          <div className="flex flex-col items-center gap-2">
            <f.icon className="size-8 text-muted-foreground" />
            <span className="text-lg">{f.text}</span>
          </div>
        </div>
      ))}
    </Grid>
  );
}

function FeaturedUsers({ featured }: { featured: User[] }) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-row items-center gap-2">
        <Heart className="size-6 text-red-400 dark:text-red-200" />
        <h3 className="text-2xl uppercase font-light">Community</h3>
      </div>
      <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
        {featured
          .filter((user) => user.username !== "_")
          .map((user) => (
            <FeaturedUser key={user.pubkey} user={user} />
          ))}
      </div>
    </div>
  );
}

function Tags({ featured }: { featured: NostrEvent[] }) {
  const tags = useMemo(() => {
    return featured.reduce(
      (acc, ev) => {
        const tags = [
          ...new Set(
            ev.tags.filter((t) => t[0] === "t" && t[1]).map((t) => t[1]),
          ),
        ];
        for (const tag of tags) {
          acc[tag] = (acc[tag] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>,
    );
  }, []);
  return <TagCloud tags={tags} />;
}

// after hero, a section that briefly explains the value prop:
// - open source, open standards
// - no platform lock-in
// - no ads
// - direct monetization
// - one content, many experiences: write and spread

export default function Home({ loaderData }: Route.ComponentProps) {
  // TODO: preload  all of this on the client to avoid flickering
  const { featured, articles, categorizedArticles } = loaderData;
  return (
    <div className="py-12 pb-32 flex flex-col gap-24">
      <div className="flex flex-col gap-16 md:gap-64 md:flex-row items-center justify-between">
        <Hero />
        <Features />
      </div>

      <CategorySection
        title="Welcome"
        icon={<HeartHandshake />}
        articles={[faq, features]}
        featured={featured}
        iconColor="text-red-400 dark:text-red-200"
      />

      <CategorySection
        title="Social Media"
        icon={<Globe />}
        articles={categorizedArticles.socialMedia}
        featured={featured}
        iconColor="text-blue-500 dark:text-blue-400"
      />

      <CategorySection
        title="Nostr"
        icon={<Network />}
        articles={categorizedArticles.nostrTech}
        featured={featured}
        iconColor="text-purple-500 dark:text-purple-400"
      />

      <CategorySection
        title="Technology & AI"
        icon={<Bot />}
        articles={categorizedArticles.tech}
        featured={featured}
        iconColor="text-slate-600 dark:text-slate-400"
      />

      <CategorySection
        title="Health & Diet"
        icon={<Apple />}
        articles={categorizedArticles.health}
        featured={featured}
        iconColor="text-emerald-500 dark:text-emerald-400"
      />

      <CategorySection
        title="Art"
        icon={<Brush />}
        articles={categorizedArticles.art}
        featured={featured}
        iconColor="text-amber-600 dark:text-amber-400"
      />

      <FeaturedHighlights {...loaderData} />

      <FeaturedUsers featured={featured} />

      <ClientOnly>{() => <Donations />}</ClientOnly>

      <Testimonials />
      {/*
        <Tags featured={articles} />
        <JoinNow />
       */}
    </div>
  );
}
