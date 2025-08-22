import { useState, createContext, useContext, type ReactNode } from "react";
import { type NostrEvent } from "nostr-tools";
import { WalletConnect } from "applesauce-wallet-connect";
import { useQuery } from "@tanstack/react-query";
import pool from "./relay-pool";
import type { FilterInput } from "applesauce-relay";
import { safeParse } from "applesauce-core/helpers";

function subscriptionMethod(relays: string[], filters: FilterInput) {
  return pool.subscription(relays, filters);
}

async function publishMethod(relays: string[], event: NostrEvent) {
  return pool.publish(relays, event);
}

WalletConnect.subscriptionMethod = subscriptionMethod;
WalletConnect.publishMethod = publishMethod;

const WALLET = "wallet";

type WalletContextType = {
  wallet: WalletConnect | undefined;
  setWallet: (w?: WalletConnect) => void;
};

type TxFilter = {
  from?: number;
  until?: number;
  limit?: number;
  offset?: number;
  unpaid?: boolean;
  type?: "incoming" | "outgoing";
};

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<WalletConnect | undefined>(() => {
    const connection = localStorage.getItem(WALLET);
    if (connection) {
      const json = safeParse(connection);
      if (json) return WalletConnect.fromJSON(json);
    }
  });

  function changeWallet(w?: WalletConnect) {
    if (w) {
      const json = w.toJSON();
      localStorage.setItem(WALLET, JSON.stringify(json));
      setWallet(w);
    } else {
      localStorage.removeItem(WALLET);
      setWallet(undefined);
    }
  }

  return (
    <WalletContext.Provider value={{ wallet, setWallet: changeWallet }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}

export const queries = {
  info: (wallet: WalletConnect) => ["wallet-info", wallet.toJSON()] as const,
  balance: (wallet: WalletConnect) =>
    ["wallet-balance", wallet.toJSON()] as const,
  transactions: (wallet: WalletConnect, filter?: TxFilter) =>
    ["wallet-txs", wallet.toJSON(), JSON.stringify(filter)] as const,
};

export function useWalletInfo() {
  const { wallet } = useWallet();
  return useQuery({
    queryKey: wallet ? queries.info(wallet) : [],
    queryFn: () => wallet!.getInfo(),
    enabled: !!wallet,
    refetchOnMount: false,
  });
}

export function useWalletBalance() {
  const { wallet } = useWallet();
  return useQuery({
    queryKey: wallet ? queries.balance(wallet) : [],
    queryFn: () => wallet!.getBalance(),
    select: ({ balance }) => balance / 1000,
    refetchOnMount: false,
    enabled: !!wallet,
  });
}

export function useWalletTransactions(filter?: TxFilter) {
  const { wallet } = useWallet();
  return useQuery({
    queryKey: wallet ? queries.transactions(wallet, filter) : [],
    queryFn: async () => {
      if (wallet?.supportsMethod("list_transactions")) {
        const { transactions } = await wallet!.listTransactions(filter);
        return { supportsTransactions: true, transactions };
      }
      return { supportsTransactions: false, transactions: [] };
    },
    refetchOnMount: false,
    enabled: !!wallet,
  });
}
