import { HandCoins, HandHeart } from "lucide-react";
import { Button } from "~/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/ui/card";
import ZapDialog from "./nostr/zap";
import { HABLA_PUBKEY } from "~/const";
import { useState } from "react";

/**
 * Habla used to offer donors a `<name>@habla.news` address and a
 * `habla.news/<name>` page. It has no domain of its own any more, so the only
 * perk left — and the only one that does not depend on one — is being featured
 * on the home page.
 */
export default function Donate() {
  const donateButton = (
    <Button className="w-full" size="lg">
      <HandCoins />
      Donate
    </Button>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">
          <div className="flex flex-row items-center gap-1">
            <HandHeart className="size-6 text-muted-foreground" />
            Donate to Habla
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-md">
          Make a contribution to support the project and get{" "}
          <strong>featured on the home page</strong>.
        </p>
        <CardFooter>
          <ZapDialog pubkey={HABLA_PUBKEY} trigger={donateButton} />
        </CardFooter>
      </CardContent>
    </Card>
  );
}

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
