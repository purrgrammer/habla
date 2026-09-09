import { buildBaseSeoTags } from "~/seo";

export function meta() {
  return buildBaseSeoTags({
    title: "Bookmarks",
    description: "Manage your bookmarks",
    type: "website",
  });
}

export default function Bookmarks() {
  return <>TODO: Bookmarks</>;
}
