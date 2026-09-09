import Editor from "~/ui/editor";

import { buildBaseSeoTags } from "~/seo";

export function meta() {
  return buildBaseSeoTags({
    title: "Write",
    description: "What's on your mind?",
    type: "website",
  });
}

// TODO: Editor skeleton
export default function Write() {
  return <Editor />;
}
