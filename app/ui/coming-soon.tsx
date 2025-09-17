import { Shovel } from "lucide-react";
import ClientOnly from "./client-only";
import { DonateButton } from "./donate";
import UserLink from "./nostr/user-link";

export default function ComingSoon() {
  return (
    <div className="w-full flex flex-col items-center gap-8 py-18">
      <div className="flex flex-col gap-6 items-center">
        <Shovel className="size-18 text-muted-foreground" />
        <p className="text-lg">
          This feature is coming soonᵀᴹ. Consider making a donation to the
          project so
          <UserLink
            wrapper="inline-block text-primary hover:underline hover:decoration-dotted"
            img="size-5"
            pubkey={
              "7fa56f5d6962ab1e3cd424e758c3002b8665f7b0d8dcee9fe9e288d7751ac194"
            }
          />{" "}
          can spend more time developing it.
        </p>
      </div>
      <div className="w-full">
        <ClientOnly>{() => <DonateButton />}</ClientOnly>
      </div>
    </div>
  );
}
