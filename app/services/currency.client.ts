import { useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";

export type Currency = "EUR" | "USD";

const FIAT_CURRENCY = "fiat-currency";

function setCurrency(newValue?: Currency) {
  if (newValue) {
    window.localStorage.setItem(FIAT_CURRENCY, newValue);
  } else {
    window.localStorage.removeItem(FIAT_CURRENCY);
  }
  // On localStoage.setItem, the storage event is only triggered on other tabs and windows.
  // So we manually dispatch a storage event to trigger the subscribe function on the current window as well.
  window.dispatchEvent(
    new StorageEvent("storage", { key: FIAT_CURRENCY, newValue }),
  );
}

const store = {
  getSnapshot: () =>
    localStorage.getItem(FIAT_CURRENCY) as Currency | undefined,
  subscribe: (listener: () => void) => {
    window.addEventListener("storage", listener);
    return () => void window.removeEventListener("storage", listener);
  },
};

export function useCurrency() {
  const currency = useSyncExternalStore(store.subscribe, store.getSnapshot);
  return {
    currency,
    setCurrency,
  };
}

export function useExchangeRate(currency: Currency) {
  return useQuery({
    queryKey: ["exchange-rate", currency],
    queryFn: () => {
      return fetch(
        `https://api.binance.com/api/v3/avgPrice?symbol=BTC${currency == "USD" ? "USDT" : currency}`,
      ).then((r) => r.json());
    },
    select: (data) => (data ? Number(data.price) : 0),
    refetchOnMount: false,
    retryOnMount: true,
  });
}
