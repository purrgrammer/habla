import Logo from "./logo";
import UserLink from "./nostr/user-link";

export default function Footer() {
  return (
    <footer className="self-end flex flex-col items-center gap-6 justify-center w-full px-8 py-6 mt-auto">
      <span className="text-4xl text-muted-foreground">𐡷</span>
      <div className="flex flex-col gap-2 items-center justify-center">
        <div className="flex flex-row items-center gap-1">
          <Logo className="size-5 mr-1 text-muted-foreground" />
          <span className="text-sm font-light">logo by</span>
          <UserLink
            wrapper="inline"
            name="text-xs text-primary hover:underline hover:decoration-dotted"
            img="hidden"
            pubkey={
              "cd408a69cc6c737ca1a76efc3fa247c6ca53ec807f6e7c9574164164797e8162"
            }
          />
        </div>
        <Logo className="size-12 mt-5" />
      </div>
    </footer>
  );
}
