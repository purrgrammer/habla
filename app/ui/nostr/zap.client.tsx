import { useState, type ReactNode } from "react";
import { match } from "ts-pattern";
import { type NostrEvent } from "nostr-tools";
import QRCode from "react-qr-code";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/ui/dialog";
import { Button } from "../button";
import {
  PlugZap,
  Zap as ZapIcon,
  Copy,
  ExternalLink,
  ChevronLeft,
} from "lucide-react";
import Grid from "../grid";
import { CurrencyAmount } from "../currency.client";
import { Input } from "../input";
import { Textarea } from "../textarea";
import { ConnectWallet } from "./nwc.client";
import { queries, useWallet } from "~/services/wallet.client";
import { WalletName } from "../wallet.client";
import { useProfile } from "~/hooks/nostr.client";
import { getInvoice, parseLNURLOrAddress } from "applesauce-core/helpers";
import type { Pubkey } from "~/types";
import { Avatar, Username } from "./user";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useActionHub } from "applesauce-react/hooks";
import { firstValueFrom } from "rxjs";
import type { DialogProps } from "@radix-ui/react-dialog";
import Debug from "../debug";
import { info } from "~/services/notifications.client";
import { useActiveAccount } from "applesauce-react/hooks";
import { ZapRequest } from "~/nostr/actions";

const amounts = [
  {
    amount: 21,
    text: "💜",
  },
  {
    amount: 210,
    text: "🍎",
  },
  {
    amount: 1000,
    text: "☕",
  },
  {
    amount: 4200,
    text: "🥪",
  },
  {
    amount: 10000,
    text: "🍔",
  },
  {
    amount: 21000,
    text: "🍱",
  },
];

function useLNURL(url?: string) {
  return useQuery({
    queryKey: ["lnurl", url],
    queryFn: async () => {
      if (!url) throw new Error(`Missing URL`);

      const lnurl = parseLNURLOrAddress(url);
      if (lnurl) {
        try {
          const response = await fetch(lnurl);
          const data = await response.json();
          return data;
        } catch (error) {
          console.error("LNURL Fetch Error:", error);
          throw error;
        }
      }
      throw new Error(`Invalid LNURL`);
    },
    refetchOnMount: false,
    enabled: !!url,
  });
}

//type ZapDialogState = "idle" | "zapping" | "invoice" | "paid";

export default function ZapDialog({
  open,
  onOpenChange,
  trigger,
  title,
  hideTitle,
  description,
  event,
  pubkey,
  children,
  placeholder = "Send a message with your zap",
}: {
  title?: string;
  hideTitle?: boolean;
  placeholder?: string;
  event?: NostrEvent;
  pubkey: Pubkey;
  description?: ReactNode;
  trigger: ReactNode;
  children?: ReactNode;
} & DialogProps) {
  const queryClient = useQueryClient();
  const hub = useActionHub();
  const activeAccount = useActiveAccount();
  const profile = useProfile(pubkey);
  const lnUrl = profile?.lud16 || profile?.lud06;
  const {
    data: lnurlInfo,
    isLoading: lnurlLoading,
    error: lnurlError,
  } = useLNURL(lnUrl);

  const { wallet } = useWallet();
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [amount, setAmount] = useState("21");
  const [invoice, setInvoice] = useState("");
  const [isZapping, setIsZapping] = useState(false);
  const isValidAmount = Number(amount) > 0;
  const currencyIcon = "size-12 text-muted-foreground";
  const state: "amount" | "invoice" | "paying" | "error" = invoice
    ? "invoice"
    : errorMessage
      ? "error"
      : isZapping
        ? "paying"
        : "amount";
  const amountStep = (
    <>
      <div className="flex flex-row items-center gap-2">
        <ZapIcon className={currencyIcon} />
        <Input
          id="amount"
          disabled={isZapping}
          type="number"
          className="h-18 text-6xl md:text-6xl text-center border-none focus:border-none"
          value={amount}
          onChange={(ev) => setAmount(ev.target.value)}
          name="amount"
          min={lnurlInfo?.minSendable ? lnurlInfo?.minSendable / 1000 : 1}
          max={
            lnurlInfo?.maxSendable
              ? lnurlInfo?.maxSendable / 1000
              : 21 * 10e6 * 10e8
          }
        />
      </div>
      <Grid className="gap-2 grid-cols-3 md:grid-cols-3 md:gap-2">
        {amounts.map((a, index) => (
          <Button
            key={index}
            disabled={Number(amount) === a.amount || isZapping}
            variant="outline"
            size="amount"
            type="button"
            onClick={() => setAmount(a.amount.toString())}
            className={
              Number(amount) === a.amount || isZapping
                ? "cursor-not-allowed"
                : "cursor-pointer"
            }
            style={
              Number(amount) === a.amount || isZapping
                ? { pointerEvents: "auto" }
                : {}
            }
          >
            <div className="flex flex-col items-center gap-1">
              <CurrencyAmount amount={a.amount} />
            </div>
          </Button>
        ))}
      </Grid>
      <Textarea
        id="zap"
        className="resize-none"
        disabled={isZapping}
        value={message}
        onChange={(ev) => setMessage(ev.target.value)}
        name="zap"
        placeholder={placeholder}
      />
    </>
  );
  const payFooter = (
    <div className="flex flex-col w-full gap-2">
      {wallet ? (
        <>
          <Button
            disabled={!isValidAmount || !lnurlInfo || isZapping}
            variant="secondary"
            onClick={onZap}
            className={
              !isValidAmount || !lnurlInfo || isZapping
                ? "cursor-not-allowed"
                : "cursor-pointer"
            }
            style={
              !isValidAmount || !lnurlInfo || isZapping
                ? { pointerEvents: "auto" }
                : {}
            }
          >
            {isZapping ? (
              "Processing..."
            ) : (
              <>
                Pay with <WalletName />
              </>
            )}
          </Button>
        </>
      ) : (
        <>
          <ConnectWallet>
            <Button variant="ghost">
              <PlugZap />
              Connect wallet
            </Button>
          </ConnectWallet>
          <Button
            disabled={!isValidAmount || !lnurlInfo || isZapping}
            variant="secondary"
            onClick={onZap}
            className={
              !isValidAmount || !lnurlInfo || isZapping
                ? "cursor-not-allowed"
                : "cursor-pointer"
            }
            style={
              !isValidAmount || !lnurlInfo || isZapping
                ? { pointerEvents: "auto" }
                : {}
            }
          >
            {isZapping ? "Processing..." : "Zap"}
          </Button>
        </>
      )}
    </div>
  );
  const invoiceStep = (
    <div className="flex flex-col items-center gap-4">
      <div className="bg-white p-4 rounded-lg">
        <QRCode
          value={`lightning:${invoice}`}
          size={200}
          className="h-auto max-w-full"
        />
      </div>
    </div>
  );

  const invoiceFooter = (
    <div className="flex flex-col w-full gap-2">
      <Button onClick={openInWallet} variant="default" className="w-full">
        <ExternalLink className="w-4 h-4 mr-2" />
        Open in wallet
      </Button>
      <Button onClick={copyInvoice} variant="outline" className="w-full">
        <Copy className="w-4 h-4 mr-2" />
        Copy invoice
      </Button>
      <Button
        onClick={() => {
          setInvoice("");
          setErrorMessage("");
        }}
        variant="ghost"
        className="w-full"
      >
        <ChevronLeft className="w-4 h-4 mr-2" />
        Back
      </Button>
    </div>
  );

  const content = match(state)
    .with("invoice", () => invoiceStep)
    .with("amount", () => amountStep)
    .with("paying", () => amountStep)
    .with("error", () => <>error</>)
    .exhaustive();

  const footer = match(state)
    .with("invoice", () => invoiceFooter)
    .with("amount", () => payFooter)
    .with("paying", () => payFooter)
    .with("error", () => null)
    .exhaustive();

  function closeDialog() {
    onOpenChange?.(false);
  }

  function openInWallet() {
    if (invoice) {
      window.open(`lightning:${invoice}`, "_blank");
    }
  }

  async function copyInvoice() {
    if (invoice) {
      try {
        await navigator.clipboard.writeText(invoice);
        info("Invoice copied to clipboard");
      } catch (err) {
        console.error("Failed to copy invoice:", err);
      }
    }
  }

  async function onZap() {
    if (!amount) return;
    if (!lnurlInfo) return;

    try {
      setIsZapping(true);

      const url = new URL(lnurlInfo.callback);

      // add amount
      const mSatsAmount = (Number(amount) * 1000).toFixed(0);
      url?.searchParams.set("amount", mSatsAmount);

      // add nostr param if it supports nostr and we have an active account
      if (lnurlInfo.allowsNostr && activeAccount) {
        const zapRequest = await firstValueFrom(
          hub.exec(ZapRequest, { amount: mSatsAmount, pubkey, event, message }),
        );
        if (zapRequest) {
          url?.searchParams.set("nostr", JSON.stringify(zapRequest));
        }
      } else if (!lnurlInfo.allowsNostr) {
        console.log("LNURL does not support Nostr - skipping zap request");
      }

      const invoice = await getInvoice(url);
      if (!invoice) return;

      if (wallet) {
        try {
          const result = await wallet.payInvoice(invoice, Number(mSatsAmount));
          queryClient.invalidateQueries({
            queryKey: queries.balance(wallet),
          });
          queryClient.invalidateQueries({
            queryKey: queries.transactions(wallet),
          });
          // notification
          info(
            `⚡ Zapped ${amount} sats to ${profile?.display_name || profile?.name || pubkey}`,
          );
          closeDialog();
          return;
        } catch (error) {
          console.error("Zap failed:", error);
        }
      }

      setInvoice(invoice);
    } catch (err) {
      console.error("Zap failed:", err);
      setErrorMessage(err instanceof Error ? err.message : "Zap failed");
    } finally {
      setIsZapping(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          {!hideTitle ? (
            <DialogTitle>
              {title || (
                <div className="flex flex-row gap-2 w-full flex-1">
                  <Avatar profile={profile} className="size-9" />
                  <div className="flex flex-row items-center justify-between flex-1">
                    <Username
                      pubkey={pubkey}
                      profile={profile}
                      className="text-xl"
                    />
                  </div>
                </div>
              )}
            </DialogTitle>
          ) : null}
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
        {content}
        <DialogFooter>{footer}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
