import ClientOnly from "~/ui/client-only";
import { buildBaseSeoTags } from "~/seo";

export function meta() {
  return buildBaseSeoTags({
    title: "Settings",
    description: "Manage your settings",
    url: "https://habla.news/settings",
    type: "website",
  });
}

export default function Settings() {
  return <ClientOnly>{() => <>TODO: Settings</>}</ClientOnly>;
}
