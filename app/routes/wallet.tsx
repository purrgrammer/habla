import ClientOnly from "~/ui/client-only";
import { ConnectWallet } from "~/ui/nostr/nwc.client";
import Wallet from "~/ui/wallet.client";

import { buildBaseSeoTags } from "~/seo";

export function meta() {
  return buildBaseSeoTags({
    title: "Wallet",
    description: "Connect and use your wallet",
  });
}

export default function Route() {
  return <ClientOnly>{() => <Wallet />}</ClientOnly>;
}
