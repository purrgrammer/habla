import NumberFlow from "@number-flow/react";
import { useMemo } from "react";
import { Euro, DollarSign } from "lucide-react";
import { cn } from "~/lib/utils";
import { useCurrency, useExchangeRate } from "~/services/currency";
import { type AmountSize, amounts } from "./amount";
import SatsAmount from "~/ui/sats";

export function FiatAmount({
  amount,
  currency = "EUR",
  size = "lg",
  className,
  iconClassname,
  amountClassname,
}: {
  amount: number; // sats
  currency?: "EUR" | "USD";
  className?: string;
  iconClassname?: string;
  amountClassname?: string;
  size?: AmountSize;
}) {
  const { data: rate } = useExchangeRate(currency);
  const { wrapper, icon, text } = amounts[size];
  const fiatAmount = useMemo(() => {
    if (!rate) return null;
    return rate * (amount * 1e-8);
  }, [amount, rate]);
  if (!rate) return null;
  return (
    <div className={cn(wrapper, className)}>
      {currency === "EUR" ? (
        <Euro className={cn(icon, iconClassname)} />
      ) : (
        <DollarSign className={cn(icon, iconClassname)} />
      )}
      <span className={cn(text, amountClassname)}>
        {fiatAmount !== null ? (
          <NumberFlow
            value={fiatAmount}
            format={{
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            }}
          />
        ) : null}
      </span>
    </div>
  );
}

export function CurrencyAmount({
  amount,
  size = "lg",
  className,
  amountClassname,
  iconClassname,
}: {
  amount: number; // sats
  className?: string;
  iconClassname?: string;
  amountClassname?: string;
  size?: AmountSize;
}) {
  const { currency } = useCurrency();
  return (
    <div className={cn("flex flex-col gap-0 items-center", className)}>
      <SatsAmount
        amount={amount}
        amountClassname={amountClassname}
        size={size}
        iconClassname={iconClassname}
      />
      {currency ? (
        <FiatAmount
          amount={amount}
          className="text-muted-foreground"
          amountClassname={amountClassname}
          currency={currency}
          iconClassname={iconClassname}
          size="sm"
        />
      ) : null}
    </div>
  );
}
