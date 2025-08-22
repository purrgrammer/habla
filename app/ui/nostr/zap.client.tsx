import { useMemo, useState, type ReactNode } from "react";
import { match } from "ts-pattern";
import { kinds, type NostrEvent } from "nostr-tools";
import { type Action } from "applesauce-actions";
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
import { PlugZap, Zap as ZapIcon } from "lucide-react";
import Grid from "../grid";
import { CurrencyAmount } from "../currency.client";
import { Input } from "../input";
import { Textarea } from "../textarea";
import { ConnectWallet } from "./nwc.client";
import { queries, useWallet } from "~/services/wallet.client";
import { WalletName } from "../wallet.client";
import { useProfile } from "~/hooks/nostr.client";
import {
  getAddressPointerForEvent,
  getInboxes,
  getInvoice,
  isReplaceable,
  parseLNURLOrAddress,
} from "applesauce-core/helpers";
import type { Pubkey } from "~/types";
import { Avatar, Username } from "./user";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useActionHub } from "applesauce-react/hooks";
import {
  addAddressTag,
  addEventTag,
  addPubkeyTag,
  setSingletonTag,
} from "applesauce-factory/operations/tag";
import { modifyPublicTags } from "applesauce-factory/operations";
import type { ProfilePointer } from "nostr-tools/nip19";
import { firstValueFrom } from "rxjs";
import type { DialogProps } from "@radix-ui/react-dialog";
import Debug from "../debug";
import NumberFlow from "@number-flow/react";
import { info } from "~/services/notifications.client";
import { useActiveAccount } from "applesauce-react/hooks";

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

function ZapRequest({
  amount,
  pubkey,
  event,
  lnurl,
  message,
}: {
  amount: string; // in msats
  pubkey: string;
  event?: NostrEvent;
  lnurl?: string;
  message?: string;
}): Action {
  return async function* ({ events, factory, self }) {
    const otherRelayList = events.getReplaceable(kinds.RelayList, pubkey);
    const otherRelays = otherRelayList ? getInboxes(otherRelayList) : [];
    const myRelaysList =
      self === pubkey
        ? otherRelayList
        : events.getReplaceable(kinds.RelayList, self);
    const myRelays =
      self === pubkey
        ? otherRelays
        : myRelaysList
          ? getInboxes(myRelaysList)
          : [];
    const relays = otherRelays.concat(myRelays);
    const pointer = {
      pubkey,
      relays: otherRelays,
    };
    const draft = await factory.build(
      {
        kind: kinds.ZapRequest,
        content: message,
      },
      modifyPublicTags(
        ...[
          addPubkeyTag(pointer),
          setSingletonTag(["amount", amount]),
          setSingletonTag(["relays", ...relays]),
          ...(lnurl ? [setSingletonTag(["lnurl", lnurl])] : []),
          ...(event
            ? [addEventTag(event), setSingletonTag(["k", String(event.kind)])]
            : []),
          ...(event && isReplaceable(event.kind)
            ? [addAddressTag(getAddressPointerForEvent(event))]
            : []),
        ],
      ),
    );
    yield await factory.sign(draft);
  };
}

function useLNURL(url?: string) {
  return useQuery({
    queryKey: ["lnurl", url],
    queryFn: async () => {
      console.log("LNURL Query starting for:", url);
      if (!url) throw new Error(`Missing URL`);

      const lnurl = parseLNURLOrAddress(url);
      console.log("Parsed LNURL:", lnurl);
      if (lnurl) {
        try {
          const response = await fetch(lnurl);
          const data = await response.json();
          console.log("LNURL Response:", data);
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
  description,
  event,
  pubkey,
  children,
  placeholder = "Send a message with your zap",
}: {
  title?: string;
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

  console.log("LNURL Query State:", {
    lnUrl,
    lnurlInfo,
    lnurlLoading,
    lnurlError: lnurlError?.message,
  });
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
  const content = match(state)
    .with("invoice", () => <Debug>{invoice}</Debug>)
    .with("amount", () => amountStep)
    .with("paying", () => amountStep)
    .with("error", () => <>error</>)
    .exhaustive();

  const footer = match(state)
    .with("invoice", () => <Debug>{invoice}</Debug>)
    .with("amount", () => payFooter)
    .with("paying", () => payFooter)
    .with("error", () => null)
    .exhaustive();

  function closeDialog() {
    onOpenChange?.(false);
  }

  async function onZap() {
    if (!amount) return;
    if (!lnurlInfo) return;

    try {
      setIsZapping(true);

      console.log("ZAPUR", lnurlInfo);
      const url = new URL(lnurlInfo.callback);

      // add amount
      const mSatsAmount = (Number(amount) * 1000).toFixed(0);
      url?.searchParams.set("amount", mSatsAmount);

      // add nostr param if it supports nostr and we have an active account
      if (lnurlInfo.allowsNostr && activeAccount) {
        console.log(
          "Creating zap request with active account:",
          activeAccount.id,
        );
        const zapRequest = await firstValueFrom(
          hub.exec(ZapRequest, { amount: mSatsAmount, pubkey, event, message }),
        );
        if (zapRequest) {
          url?.searchParams.set("nostr", JSON.stringify(zapRequest));
        }
      } else if (lnurlInfo.allowsNostr && !activeAccount) {
        console.log(
          "LNURL supports Nostr but no active account - skipping zap request",
        );
      } else if (!lnurlInfo.allowsNostr) {
        console.log("LNURL does not support Nostr - skipping zap request");
      }

      const invoice = await getInvoice(url);
      if (!invoice) return;

      if (wallet) {
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
      } else {
        setInvoice(invoice);
      }
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
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
        {content}
        <DialogFooter>{footer}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
