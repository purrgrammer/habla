import { Link, useNavigate } from "react-router";
import { kinds } from "nostr-tools";
import {
  useWallet,
  useWalletBalance,
  useWalletTransactions,
  useWalletInfo,
} from "~/services/wallet.client";
import { ConnectWallet } from "./nostr/nwc.client";
import { Button } from "./button";
import {
  Bitcoin,
  Zap,
  PlugZap,
  ExternalLink,
  Wallet as WalletIcon,
  Unplug,
  Cog,
} from "lucide-react";
import { CurrencyAmount } from "./currency.client";
import { ScrollArea } from "./scroll-area";
import { parseBolt11, safeParse } from "applesauce-core/helpers";
import UserLink from "./nostr/user-link.client";
import { cn } from "~/lib/utils";
import { useMemo, useState } from "react";
import type { Transaction as Tx } from "applesauce-wallet-connect/helpers";

function Transaction({ t }: { t: Tx }) {
  const eventLike = t.description && t.description.startsWith("{");
  const event = eventLike ? safeParse(t.description!) : null;
  const isLightning = t.invoice?.startsWith("ln");
  const isOnChain = t.invoice?.startsWith("bc1");
  const parsedInvoice = useMemo(
    () => (isLightning ? parseBolt11(t.invoice!) : null),
    [],
  );
  const pubkey =
    event?.kind === kinds.ZapRequest && event?.pubkey ? event.pubkey : null;
  const isPending = !t.preimage && !isOnChain;
  const icon = `size-8 flex-shrink-0 ${t.type === "outgoing" ? (isPending ? "text-red-100" : "text-red-700") : "text-green-800 dark:text-green-500"}`;
  const invoiceDescription = parsedInvoice?.description;
  const isMetadataDescription =
    t.description &&
    t.description.startsWith("[[") &&
    t.description?.endsWith("]]");
  const metadata =
    isMetadataDescription && t.description ? safeParse(t.description) : null;
  const identifier = metadata
    ?.find((t: string[]) => {
      if (t.at(0) === "text/identifier") {
        return t.at(1);
      }
    })
    ?.at(1);
  const isZapDescription =
    t.description &&
    t.description.startsWith("{") &&
    t.description?.endsWith("}");
  const zapRequest =
    isZapDescription && t.description ? safeParse(t.description) : null;
  const text =
    event?.kind === kinds.ZapRequest && event?.content
      ? event.content
      : t.description && !isMetadataDescription && !isZapDescription
        ? t.description
        : invoiceDescription
          ? invoiceDescription
          : t.type === "outgoing"
            ? isPending
              ? "Pending payment"
              : "Payment"
            : isPending
              ? "Pending receive"
              : zapRequest?.content
                ? zapRequest.content
                : "";

  return (
    <div>
      <div
        className={cn(
          "flex flex-row items-start justify-between py-1",
          isPending ? "animate-pulse" : "",
        )}
      >
        <div className="flex flex-row items-center gap-2">
          <div className="flex flex-col gap-1">
            {pubkey ? (
              <UserLink name="line-clamp-1" pubkey={pubkey} />
            ) : identifier ? (
              <span>{identifier}</span>
            ) : null}
            {isOnChain ? (
              <div className="flex flex-row items-center gap-3">
                <span className="text-lg lnine-clamp-1">{text}</span>
                <Link
                  className="flex flex-row items-center gap-1"
                  to={`https://mempool.space/tx/${t.preimage}`}
                  target="_blank"
                >
                  <ExternalLink className="size-5 text-muted-foreground" />
                  <img
                    src="https://mempool.space/resources/favicons/favicon-32x32.png"
                    className="size-5 inline-block"
                  />
                </Link>
              </div>
            ) : null}
          </div>
        </div>
        <CurrencyAmount
          amount={t.amount / 1000}
          className="flex-row items-center gap-2"
        />
      </div>
      {text ? (
        <div className="ml-2.5 border-l-2 pl-2 py-1">
          <span className="text-md leading-tight text-muted-foreground">
            {text}
          </span>
        </div>
      ) : null}
    </div>
  );
}

function Transactions({ transactions }: { transactions: Tx[] }) {
  return (
    <ScrollArea>
      {transactions.map((t) => (
        <Transaction t={t} key={t.preimage} />
      ))}
    </ScrollArea>
  );
}

export default function Wallet() {
  const { wallet, setWallet } = useWallet();
  const { data: walletBalance } = useWalletBalance();
  const { data: transactionsData } = useWalletTransactions({
    limit: 20,
  });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const { transactions, supportsTransactions } = transactionsData || {
    supportsTransactions: true,
    transactions: [],
  };
  const navigate = useNavigate();

  function settings() {
    setShowSettingsModal(true);
  }

  function disconnect() {
    // TODO: alert "are you sure?"
    navigate("/");
    setWallet();
  }

  if (!wallet) {
    return (
      <div className="flex flex-col gap-8 my-12 w-full">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl">Connect a wallet</h1>
          <p className="text-lg text-muted-foreground">
            Connect a wallet via NWC to make payments instantly
          </p>
        </div>
        <ConnectWallet>
          <Button variant="default" size="lg">
            <PlugZap />
            Connect wallet
          </Button>
        </ConnectWallet>
      </div>
    );
  }
  return (
    <div className="w-full flex flex-col gap-5 items-center">
      <WalletName />
      {walletBalance ? (
        <CurrencyAmount amount={walletBalance} size="xl" />
      ) : null}
      {transactions ? (
        <Transactions transactions={transactions} />
      ) : supportsTransactions ? (
        <Transactions transactions={[]} />
      ) : (
        <span className="text-xs text-muted-foreground">
          Transaction list not supported
        </span>
      )}
      <div className="py-4 flex flex-row gap-4 justify-between w-full">
        <Button disabled variant="outline" onClick={settings}>
          <Cog /> Settings
        </Button>
        <Button variant="destructive" onClick={disconnect}>
          <Unplug /> Disconnect
        </Button>
      </div>
    </div>
  );
}

export function WalletName() {
  const { data: walletInfo } = useWalletInfo();
  return (
    <div className="flex flex-row items-center gap-4 justify-between">
      <div className="flex flex-row items-center gap-2">
        <WalletIcon className="text-muted-foreground" />
        {walletInfo?.alias || "Wallet"}
      </div>
    </div>
  );
}

export function WalletBalance() {
  const { data: walletBalance } = useWalletBalance();
  return walletBalance ? (
    <div className="flex flex-row items-center gap-4 justify-between">
      <WalletName />
      <CurrencyAmount amount={walletBalance} className="items-end" />
    </div>
  ) : (
    <WalletName />
  );
}
