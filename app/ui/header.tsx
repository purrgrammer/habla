import LoginClient from "~/ui/nostr/login.client";
import { Link } from "react-router";
import ClientOnly from "~/ui/client-only";
import Logo from "~/ui/logo";
import { Avatar as AvatarSkeleton } from "~/ui/skeleton";

export default function Header() {
  return (
    <header className="flex flex-row items-center justify-between w-full px-6 py-2">
      <Link to="/">
        <Logo />
      </Link>
      <ClientOnly fallback={<AvatarSkeleton />}>
        {() => <LoginClient />}
      </ClientOnly>
    </header>
  );
}
