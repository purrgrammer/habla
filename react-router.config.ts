import { vercelPreset } from "@vercel/react-router/vite";
import type { Config } from "@react-router/dev/config";
import { getFeaturedUsers, getArticles } from "./app/featured";
//import { fetchArticles, fetchRelays } from "./app/services/nostr.server";
import { getTagValue } from "applesauce-core/helpers";

export default {
  ssr: true,
  presets: [vercelPreset()],
  async prerender() {
    let result = ["/", "/sitemap.xml", "/.well-known/nostr.json"];
    const users = await getFeaturedUsers();
    for (const user of users) {
      result.push(`${user.nip05}`);
      //const relays = await fetchRelays(user.pubkey)
      const articles = await getArticles(user);
      for (const article of articles) {
        result.push(`/${user.nip05}/${getTagValue(article, "d")}`);
      }
    }
    return result;
  },
} satisfies Config;
