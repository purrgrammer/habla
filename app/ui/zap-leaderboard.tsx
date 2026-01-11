import type { ReactNode } from "react";
import { HABLA_PUBKEY } from "~/const";
import { usePubkeyZaps, type Zap } from "~/hooks/nostr";
import UserLink from "./nostr/user-link";
import { CurrencyAmount } from "./currency";
import { Crown } from "lucide-react";
import type { Pubkey } from "~/types";

const topZapSizes = {
  md: {
    name: "text-xl line-clamp-1",
    img: "size-16",
  },
  lg: {
    name: "text-2xl line-clamp-1",
    img: "size-24",
  },
};

function TopZap({
  pubkey,
  amount,
  size = "lg",
  marker,
}: {
  pubkey: string;
  amount: number;
  size: "md" | "lg";
  marker?: ReactNode;
}) {
  const { name, img } = topZapSizes[size];
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex flex-col items-center gap-1">
        {marker ? marker : <Crown className="size-9 text-yellow-600" />}
        <UserLink
          pubkey={pubkey}
          className="flex flex-col"
          name={name}
          img={img}
        />
      </div>
      <CurrencyAmount amount={amount} />
    </div>
  );
}

export default function ZapLeaderboard({
  pubkey = HABLA_PUBKEY,
}: {
  pubkey: Pubkey;
}) {
  const { zappers, total } = usePubkeyZaps(pubkey) || {
    zaps: [],
    zappers: [],
    total: 0,
  };
  const [topZapper, secondZapper, thirdZapper, ...restZappers] = zappers;
  return (
    <div className="flex flex-col items-center gap-8 w-full">
      <CurrencyAmount amount={total} size="xl" />
      <div className="flex flex-col items-center gap-0 w-full">
        {topZapper ? <TopZap {...topZapper} size="lg" /> : null}
        <div className="flex flex-row items-center justify-between w-full">
          <div className="flex-1">
            {secondZapper ? (
              <TopZap
                {...secondZapper}
                size="md"
                marker={
                  <span className="text-lg font-mono text-muted-foreground">
                    2
                  </span>
                }
              />
            ) : null}
          </div>
          <div className="flex-1">
            {thirdZapper ? (
              <TopZap
                {...thirdZapper}
                size="md"
                marker={
                  <span className="text-lg font-mono text-muted-foreground">
                    3
                  </span>
                }
              />
            ) : null}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2 flex-1 w-full">
        {restZappers.slice(0, 7).map((z, index) => (
          <div key={z.pubkey} className="flex flex-row items-center gap-2">
            <span className="w-5 mr-2 text-right text-lg font-mono text-muted-foreground">
              {index + 4}
            </span>
            <div className="flex flex-row items-center flex-1 gap-3 justify-between">
              <UserLink
                pubkey={z.pubkey}
                img="size-10"
                className="overflow-hidden text-ellipsis"
                name="text-xl line-clamp-1"
              />
              <CurrencyAmount amount={z.amount} className="items-end" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
