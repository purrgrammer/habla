import ClientOnly from "~/ui/client-only";
import { buildBaseSeoTags } from "~/seo";

export function meta() {
  return buildBaseSeoTags({
    title: "Bookmarks",
    description: "Manage your bookmarks",
    url: "https://habla.news/bookmarks",
    type: "website",
  });
}

export default function Bookmarks() {
  return <ClientOnly>{() => <>TODO: Bookmarks</>}</ClientOnly>;
}
