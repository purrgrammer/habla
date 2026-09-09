import { Link } from "react-router";
import Logo from "./logo";
import EditorMenu, { type EditorMenuProps } from "./editor-menu";

export default function EditorHeader(props: EditorMenuProps) {
  return (
    <header className="flex flex-row justify-between items-center w-full p-2">
      <Link to="/">
        <Logo />
      </Link>
      <EditorMenu {...props} />
    </header>
  );
}
