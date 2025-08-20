import { useCallback, useSyncExternalStore } from "react";
import { Zap, Euro, DollarSign } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export type FiatCurrency = "EUR" | "USD";
export type BTCCurrency = "BTC" | "sats";
export type Currency = BTCCurrency | FiatCurrency;

const FIAT_CURRENCIES = new Set(["EUR", "USD"]);
const CURRENCY = "currency";

function setCurrency(newValue: Currency) {
  window.localStorage.setItem(CURRENCY, newValue);
  // On localStoage.setItem, the storage event is only triggered on other tabs and windows.
  // So we manually dispatch a storage event to trigger the subscribe function on the current window as well.
  window.dispatchEvent(
    new StorageEvent("storage", { key: CURRENCY, newValue }),
  );
}

const store = {
  getSnapshot: () => localStorage.getItem(CURRENCY) as Currency,
  subscribe: (listener: () => void) => {
    window.addEventListener("storage", listener);
    return () => void window.removeEventListener("storage", listener);
  },
};

// Set the initial value.
if (!store.getSnapshot()) {
  localStorage.setItem(CURRENCY, "sats");
}

export function useCurrency() {
  const currency = useSyncExternalStore(store.subscribe, store.getSnapshot);
  const useFiat = currency !== "BTC" && currency !== "sats";
  return {
    currency,
    setCurrency,
    nextCurrency: useCallback(() => {
      const newCurrency =
        currency === "sats"
          ? "EUR"
          : currency === "EUR"
            ? "USD"
            : currency === "USD"
              ? "BTC"
              : "sats";
      setCurrency(newCurrency);
    }, [currency]),
    useFiat,
  };
}

export function useExchangeRate(currency: Currency) {
  return useQuery({
    queryKey: ["exchange-rate", currency],
    queryFn: () => {
      if (currency === "BTC") return { price: 1 };
      return fetch(
        `https://api.binance.com/api/v3/avgPrice?symbol=BTC${currency == "USD" ? "USDT" : currency}`,
      ).then((r) => r.json());
    },
    select: (data) => (data ? Number(data.price) : 0),
    refetchOnMount: false,
    retryOnMount: true,
  });
}
