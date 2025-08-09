import Editor from "~/ui/editor.client";
import ClientOnly from "~/ui/client-only";

export function meta() {
  return [
    { title: "Write" },
    { name: "description", content: "What's on your mind?" },
  ];
}

// TODO: Editor skeleton
export default function Write() {
  return <ClientOnly>{() => <Editor />}</ClientOnly>;
}
