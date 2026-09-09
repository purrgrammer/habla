import { buildBaseSeoTags } from "~/seo";

export function meta() {
  return buildBaseSeoTags({
    title: "Settings",
    description: "Manage your settings",
    type: "website",
  });
}

export default function Settings() {
  return <>TODO: Settings</>;
}
