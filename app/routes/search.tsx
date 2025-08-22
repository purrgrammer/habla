import ClientOnly from "~/ui/client-only";
import { buildBaseSeoTags } from "~/seo";

export function meta() {
  return buildBaseSeoTags({
    title: "Search",
    description: "Find content and highlights",
    url: "https://habla.news/search",
    type: "website",
  });
}

export default function Search() {
  return <ClientOnly>{() => <>TODO: Search</>}</ClientOnly>;
}
