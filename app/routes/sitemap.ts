import type { Route } from "./+types/sitemap";
import { getMembers, getArticles } from "~/services/data.server";
import { getArticlePublished, getTagValue } from "applesauce-core/helpers";

// Escape special XML characters in URLs
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Validate and convert Unix timestamp to ISO string
function getValidTimestamp(timestamp: number | undefined, fallback: string): string {
  if (!timestamp) return fallback;

  // Unix timestamps are in seconds, should be positive and reasonable
  // Valid range: after 2000-01-01 (946684800) and before 2100-01-01 (4102444800)
  if (timestamp < 946684800 || timestamp > 4102444800) {
    return fallback;
  }

  try {
    const date = new Date(timestamp * 1000);
    // Verify the date is valid
    if (isNaN(date.getTime())) {
      return fallback;
    }
    return date.toISOString();
  } catch {
    return fallback;
  }
}

// Validate identifier and URL components
function isValidIdentifier(identifier: string | undefined): identifier is string {
  if (!identifier || typeof identifier !== "string") return false;
  // Check for reasonable length and no control characters
  return identifier.length > 0 && identifier.length < 500 && !/[\x00-\x1F\x7F]/.test(identifier);
}

// Generate sitemap XML with proper structure and SEO metadata
export async function loader({ request }: Route.LoaderArgs) {
  const origin = new URL(request.url).origin;
  const lastModified = new Date().toISOString();

  // Get all featured users and their articles
  const users = await getMembers();
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
    if (!isValidIdentifier(user.nip05)) continue;

    urls.push({
      url: `${origin}/${encodeURIComponent(user.nip05)}`,
      lastmod: lastModified,
      changefreq: "weekly",
      priority: "0.8",
    });

    // Add user's articles
    try {
      const articles = await getArticles(user);
      for (const article of articles) {
        const identifier = getTagValue(article, "d");
        if (!isValidIdentifier(identifier)) continue;

        const publishedAt = getArticlePublished(article);
        const articleLastMod = getValidTimestamp(publishedAt, lastModified);

        urls.push({
          url: `${origin}/${encodeURIComponent(user.nip05)}/${encodeURIComponent(identifier)}`,
          lastmod: articleLastMod,
          changefreq: "monthly",
          priority: "0.9",
        });
      }
    } catch (error) {
      // Skip articles if there's an error fetching them
      console.error(`Error fetching articles for ${user.nip05}:`, error);
    }
  }

  // Add .well-known/nostr.json for NIP-05
  urls.push({
    url: `${origin}/.well-known/nostr.json`,
    lastmod: lastModified,
    changefreq: "weekly",
    priority: "0.5",
  });

  // Generate XML sitemap with proper escaping
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    ({ url, lastmod, changefreq, priority }) => `  <url>
    <loc>${escapeXml(url)}</loc>
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
      "Cache-Control": "public, max-age=3600",
    },
  });
}
