import { HandHeart } from "lucide-react";
import { Button } from "~/ui/button";
import ZapDialog from "./nostr/zap";
import { HABLA_PUBKEY } from "~/const";
import { useState } from "react";

/**
 * The home page used to carry a donation card promising perks — a
 * `<name>@habla.news` address, a `habla.news/<name>` page, a spot in the
 * Community grid. Habla has no domain of its own and no home-page grid any
 * more, so only the button survives, on the pages that are still `ComingSoon`.
 */
export function DonateButton() {
  const [isDonating, setIsDonating] = useState(false);
  return (
    <ZapDialog
      open={isDonating}
      onOpenChange={setIsDonating}
      pubkey={HABLA_PUBKEY}
      trigger={
        <Button size="lg" className="w-full">
          <HandHeart />
          <span className="dark:text-foreground">Donate</span>
        </Button>
      }
    />
  );
}
