import { buildBaseSeoTags } from "~/seo";

export function meta() {
  return buildBaseSeoTags({
    title: "Search",
    description: "Find content and highlights",
    type: "website",
  });
}

export default function Search() {
  return <>TODO: Search</>;
}
