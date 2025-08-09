import { useMemo } from "react";
import { Euro, DollarSign, Bitcoin, Zap } from "lucide-react";
import { cn } from "~/lib/utils";
import {
  type Currency,
  type BTCCurrency,
  type FiatCurrency,
  useCurrency,
  useExchangeRate,
} from "~/services/currency.client";

type AmountSize = "lg" | "xl";
type AmountProps = {
  wrapper: string;
  icon: string;
  text: string;
};

const amounts: Record<AmountSize, AmountProps> = {
  lg: {
    wrapper: "flex flex-row items-center gap-1",
    icon: "size-5 text-muted-foreground",
    text: "font-mono text-lg",
  },
  xl: {
    wrapper: "flex flex-row items-center gap-2",
    icon: "size-12 text-muted-foreground",
    text: "font-mono text-4xl",
  },
};

export function SatsAmount({
  amount,
  size = "lg",
  currency = "sats",
  className,
}: {
  amount: number;
  size?: AmountSize;
  currency?: BTCCurrency;
  className?: string;
}) {
  const { wrapper, icon, text } = amounts[size];
  const { nextCurrency } = useCurrency();
  const formatted = useMemo(() => {
    if (currency === "sats") {
      return amount;
    }
    const formatter = new Intl.NumberFormat("en", {
      style: "currency",
      currency: "XBT",
      minimumFractionDigits: 8,
      maximumFractionDigits: 8,
    });
    return formatter
      .format(amount * 1e-8)
      .replace("XBT", "")
      .trim();
  }, [amount, currency]);
  return (
    <div className={cn(wrapper, className)}>
      {currency === "sats" ? (
        <Zap className={icon} onClick={nextCurrency} />
      ) : (
        <Bitcoin className={icon} onClick={nextCurrency} />
      )}
      <span className={text}>{formatted}</span>
    </div>
  );
}

export function Amount({
  amount,
  size = "lg",
}: {
  amount: number;
  size?: AmountSize;
}) {
  const { text } = amounts[size];
  return <span className={text}>{amount}</span>;
}

export function FiatAmount({
  amount,
  currency = "EUR",
  size = "lg",
  className,
}: {
  amount: number; // sats
  currency: "EUR" | "USD";
  className?: string;
  size?: AmountSize;
}) {
  const { data: rate } = useExchangeRate(currency);
  const { nextCurrency } = useCurrency();
  const { wrapper, icon, text } = amounts[size];
  const fiatAmount = useMemo(() => {
    if (!rate) return null;
    return rate * (10e-8 * amount);
  }, [amount, rate]);
  const formatted = useMemo(() => {
    if (!fiatAmount) return null;
    const formatter = new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    return formatter
      .format(fiatAmount)
      .replace("$", "")
      .replace("€", "")
      .trim();
  }, [amount, rate]);
  if (formatted) {
    return (
      <div className={cn(wrapper, className)}>
        {currency === "EUR" ? (
          <Euro className={icon} onClick={nextCurrency} />
        ) : (
          <DollarSign className={icon} onClick={nextCurrency} />
        )}
        <span className={text}>{formatted}</span>
      </div>
    );
  }
  return null;
}

export function CurrencyAmount({
  amount,
  size = "lg",
  className,
}: {
  amount: number; // sats
  className?: string;
  size?: AmountSize;
}) {
  const { currency, useFiat } = useCurrency();
  if (useFiat) {
    return (
      <FiatAmount
        amount={amount}
        currency={currency as FiatCurrency}
        size={size}
        className={className}
      />
    );
  }
  return (
    <SatsAmount
      currency={currency as BTCCurrency}
      amount={amount}
      size={size}
      className={className}
    />
  );
}
