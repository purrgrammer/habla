import { Link } from "react-router";
import EditorMenu, { type EditorMenuProps } from "~/ui/editor-menu.client";
import ClientOnly from "~/ui/client-only";
import { Avatar as AvatarSkeleton } from "~/ui/skeleton";
import Logo from "./logo";

export default function EditorHeader(props: EditorMenuProps) {
  return (
    <header className="flex flex-row justify-between w-full p-2">
      <Link to="/">
        <Logo />
      </Link>
      <ClientOnly fallback={<AvatarSkeleton />}>
        {() => <EditorMenu {...props} />}
      </ClientOnly>
    </header>
  );
}
