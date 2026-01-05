import Editor from "~/ui/editor";
import ClientOnly from "~/ui/client-only";

import { buildBaseSeoTags } from "~/seo";

export function meta() {
  return buildBaseSeoTags({
    title: "Write",
    description: "What's on your mind?",
    url: "https://habla.news/write",
    type: "website",
  });
}

// TODO: Editor skeleton
export default function Write() {
  return <ClientOnly>{() => <Editor />}</ClientOnly>;
}
