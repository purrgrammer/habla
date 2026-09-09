import LoginClient from "~/ui/nostr/login";
import { Link } from "react-router";
import Logo from "~/ui/logo";

export default function Header() {
  return (
    <header className="flex flex-row items-center justify-between w-full px-6 py-2">
      <Link to="/">
        <Logo />
      </Link>
      <LoginClient />
    </header>
  );
}
