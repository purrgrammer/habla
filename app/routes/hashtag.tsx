import { useState, useMemo, useEffect } from "react";
import { useFetcher } from "react-router";
import type { Route } from "./+types/hashtag";
import { buildBaseSeoTags } from "~/seo";
import { fetchArticlesByTag, fetchProfile } from "~/services/data.server";
import { type ProfileContent, getArticleTitle, getTagValue } from "applesauce-core/helpers";
import ArticleCard from "~/ui/nostr/article-card";
import Grid from "~/ui/grid";
import { Button } from "~/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/ui/select";

export function meta({ params }: Route.MetaArgs) {
  const { tag } = params;
  return buildBaseSeoTags({
    title: `#${tag}`,
    description: `Explore the content tagged with #${tag}`,
    url: `https://habla.news/tag/${tag}`,
  });
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { tag } = params;
  if (!tag) throw new Response("Not Found", { status: 404 });

  const url = new URL(request.url);
  const untilParam = url.searchParams.get("until");
  const until = untilParam ? parseInt(untilParam) : undefined;

  const articles = await fetchArticlesByTag(tag, 50, until);
  const pubkeys = [...new Set(articles.map((a) => a.pubkey))];
  const profiles = await Promise.all(
    pubkeys.map((pubkey) => fetchProfile({ pubkey }))
  );

  const authors = pubkeys.reduce((acc, pubkey, i) => {
    if (profiles[i]) acc[pubkey] = profiles[i];
    return acc;
  }, {} as Record<string, ProfileContent>);

  return { articles, authors, tag };
}

type SortOption = "newest" | "oldest" | "title_asc" | "title_desc" | "author_asc" | "author_desc";

export default function Hashtag({ loaderData }: Route.ComponentProps) {
  const { tag } = loaderData;
  const [articles, setArticles] = useState(loaderData.articles);
  const [authors, setAuthors] = useState(loaderData.authors);
  const [sort, setSort] = useState<SortOption>("newest");
  const fetcher = useFetcher<typeof loader>();

  useEffect(() => {
    setArticles(loaderData.articles);
    setAuthors(loaderData.authors);
  }, [loaderData.tag, loaderData.articles, loaderData.authors]);

  useEffect(() => {
    if (fetcher.data) {
      if (fetcher.data.articles.length > 0) {
        setArticles((prev) => {
          const newArticles = fetcher.data!.articles.filter(
            (a) => !prev.some((existing) => existing.id === a.id)
          );
          return [...prev, ...newArticles];
        });
        setAuthors((prev) => ({ ...prev, ...fetcher.data!.authors }));
      }
    }
  }, [fetcher.data]);

  const loadMore = () => {
    if (articles.length === 0) return;
    const oldestArticle = articles.reduce((min, p) => p.created_at < min.created_at ? p : min, articles[0]);
    if (oldestArticle) {
      fetcher.load(`/t/${tag}?until=${oldestArticle.created_at - 1}`);
    }
  };

  const sortedArticles = useMemo(() => {
    return [...articles].sort((a, b) => {
      switch (sort) {
        case "newest":
          return b.created_at - a.created_at;
        case "oldest":
          return a.created_at - b.created_at;
        case "title_asc":
          return (getArticleTitle(a) || "").localeCompare(getArticleTitle(b) || "");
        case "title_desc":
          return (getArticleTitle(b) || "").localeCompare(getArticleTitle(a) || "");
        case "author_asc": {
          const authorA = authors[a.pubkey]?.name || "";
          const authorB = authors[b.pubkey]?.name || "";
          return authorA.localeCompare(authorB);
        }
        case "author_desc": {
          const authorA = authors[a.pubkey]?.name || "";
          const authorB = authors[b.pubkey]?.name || "";
          return authorB.localeCompare(authorA);
        }
        default:
          return 0;
      }
    });
  }, [articles, authors, sort]);

  return (
    <div className="flex flex-col gap-8 w-full py-8">
      <div className="flex flex-row items-center justify-between">
        <div className="flex flex-row gap-1 items-end">
          <span className="text-3xl font-light text-muted-foreground">#</span>
          <h1 className="text-4xl">{tag}</h1>
           <span className="text-lg text-muted-foreground ml-2">
            ({articles.length} articles)
          </span>
        </div>
        
        <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
            <SelectItem value="title_asc">Title (A-Z)</SelectItem>
            <SelectItem value="title_desc">Title (Z-A)</SelectItem>
            <SelectItem value="author_asc">Author (A-Z)</SelectItem>
            <SelectItem value="author_desc">Author (Z-A)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {sortedArticles.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">
          No articles found with this tag.
        </div>
      ) : (
        <>
          <Grid>
            {sortedArticles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                author={authors[article.pubkey]}
                address={{
                  kind: article.kind,
                  pubkey: article.pubkey,
                  identifier: getTagValue(article, "d") || "",
                }}
              />
            ))}
          </Grid>
          
          <div className="flex justify-center mt-8">
            <Button 
              variant="outline" 
              onClick={loadMore} 
              disabled={fetcher.state === "loading"}
            >
              {fetcher.state === "loading" ? "Loading..." : "Load more"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
