import { vercelPreset } from "@vercel/react-router/vite";
import type { Config } from "@react-router/dev/config";
import { getMembers, getArticles } from "./app/services/data.server";
import { getTagValue } from "applesauce-core/helpers";

export default {
  ssr: true,
  presets: [vercelPreset()],
  async prerender() {
    let result = ["/", "/sitemap.xml", "/.well-known/nostr.json"];
    const users = await getMembers();
    for (const user of users) {
      result.push(`${user.nip05}`);
      const articles = await getArticles(user);
      for (const article of articles) {
        result.push(`/${user.nip05}/${getTagValue(article, "d")}`);
      }
    }
    return result;
  },
} satisfies Config;
