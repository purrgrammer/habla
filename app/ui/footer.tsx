import Logo from "./logo";
import UserLink from "./nostr/user-link";

export default function Footer() {
  return (
    <footer className="self-end flex flex-col items-center gap-6 justify-center w-full px-8 py-6 mt-auto">
      <span className="text-4xl text-muted-foreground">𐡷</span>
      <div className="flex flex-col gap-2 items-center justify-center">
        <p className="font-light text-sm">
          <span>code</span>
          <span className="text-muted-foreground"> ― </span>
          <UserLink
            wrapper="inline-block text-primary hover:underline hover:decoration-dotted"
            name="text-sm"
            img="size-5"
            pubkey={
              "7fa56f5d6962ab1e3cd424e758c3002b8665f7b0d8dcee9fe9e288d7751ac194"
            }
          />
        </p>
        <p className="font-light text-sm">
          <span>logo</span>
          <span className="text-muted-foreground"> ― </span>
          <UserLink
            wrapper="inline-block text-primary hover:underline hover:decoration-dotted"
            name="text-sm"
            img="size-5"
            pubkey={
              "cd408a69cc6c737ca1a76efc3fa247c6ca53ec807f6e7c9574164164797e8162"
            }
          />
        </p>
        <Logo className="size-7 mt-5 text-muted-foreground" />
      </div>
    </footer>
  );
}
