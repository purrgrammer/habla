/**
 * Generates the static files that used to be server routes.
 *
 * Habla ships as a folder of static files, so `.well-known/nostr.json` and
 * `sitemap.xml` cannot be computed per request any more — they are written into
 * `public/` from the member registry at build time.
 *
 * Run via `pnpm gen:static` (which `pnpm build` does for you).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { MEMBERS, MEMBER_NAMES } from "../app/members";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "public");

/** Where the deployed site lives, for absolute sitemap URLs. */
const SITE_URL = (process.env.SITE_URL ?? "https://habla.news").replace(
  /\/$/,
  "",
);

function write(relativePath: string, contents: string) {
  const target = join(publicDir, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents);
  console.log(`[gen:static] ${relativePath} (${contents.length} bytes)`);
}

// NIP-05: https://<host>/.well-known/nostr.json?name=<username>
// Served statically, so it answers every name at once and ignores the query
// string — which is what every client does with the response anyway.
write(
  ".well-known/nostr.json",
  JSON.stringify({ names: MEMBER_NAMES, relays: {} }, null, 2) + "\n",
);

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Articles live on relays and are not knowable at build time, so the sitemap
// covers the home page and one profile page per member.
const lastmod = new Date().toISOString();
const urls = [
  { loc: SITE_URL, changefreq: "daily", priority: "1.0" },
  ...MEMBERS.filter(({ username }) => username !== "_").map(({ username }) => ({
    loc: `${SITE_URL}/${encodeURIComponent(username)}`,
    changefreq: "weekly",
    priority: "0.8",
  })),
];

write(
  "sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    ({ loc, changefreq, priority }) => `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>
`,
);
