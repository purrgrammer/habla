import { vercelPreset } from "@vercel/react-router/vite";
import type { Config } from "@react-router/dev/config";
import { getMembers, getArticles } from "./app/services/data.server";
import { getTagValue } from "applesauce-core/helpers";

// Validate identifier for URL safety
function isValidIdentifier(identifier: string | undefined): identifier is string {
  if (!identifier || typeof identifier !== "string") return false;
  // Check for reasonable length and no control characters
  return (
    identifier.length > 0 &&
    identifier.length < 500 &&
    !/[\x00-\x1F\x7F]/.test(identifier)
  );
}

export default {
  ssr: true,
  presets: [vercelPreset()],
  async prerender() {
    let result = ["/", "/sitemap.xml", "/.well-known/nostr.json"];
    try {
      const users = await getMembers();
      for (const user of users) {
        result.push(`${user.nip05}`);
        const articles = await getArticles(user);
        for (const article of articles) {
          const identifier = getTagValue(article, "d");
          if (!isValidIdentifier(identifier)) continue;
          result.push(`/${user.nip05}/${encodeURIComponent(identifier)}`);
        }
      }
    } catch (error) {
      console.warn("Failed to fetch dynamic routes for prerendering (likely Redis unavailable):", error);
    }
    return result;
  },
} satisfies Config;
