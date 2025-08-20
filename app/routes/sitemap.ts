import type { Route } from "./+types/sitemap[.]xml";
import { getFeaturedUsers, getArticles } from "~/featured";
import { getTagValue } from "applesauce-core/helpers";

// Generate sitemap XML with proper structure and SEO metadata
export async function loader({ request }: Route.LoaderArgs) {
  const origin = new URL(request.url).origin;
  const lastModified = new Date().toISOString();

  // Get all featured users and their articles
  const users = await getFeaturedUsers();
  const urls: Array<{
    url: string;
    lastmod: string;
    changefreq: "daily" | "weekly" | "monthly";
    priority: string;
  }> = [];

  // Add homepage with highest priority
  urls.push({
    url: origin,
    lastmod: lastModified,
    changefreq: "daily",
    priority: "1.0",
  });

  // Add user profile pages
  for (const user of users) {
    urls.push({
      url: `${origin}/${user.nip05}`,
      lastmod: lastModified,
      changefreq: "weekly",
      priority: "0.8",
    });

    // Add user's articles
    const articles = await getArticles(user);
    for (const article of articles) {
      const identifier = getTagValue(article, "d");
      const publishedAt = getTagValue(article, "published_at");
      const articleLastMod = publishedAt
        ? new Date(parseInt(publishedAt) * 1000).toISOString()
        : lastModified;

      urls.push({
        url: `${origin}/${user.nip05}/${identifier}`,
        lastmod: articleLastMod,
        changefreq: "monthly",
        priority: "0.9", // Articles get high priority
      });
    }
  }

  // Add .well-known/nostr.json for NIP-05
  urls.push({
    url: `${origin}/.well-known/nostr.json`,
    lastmod: lastModified,
    changefreq: "weekly",
    priority: "0.5",
  });

  // Generate XML sitemap
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    ({ url, lastmod, changefreq, priority }) => `  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600", // Cache for 1 hour
    },
  });
}
