import NumberFlow from "@number-flow/react";
import { Bitcoin, Zap } from "lucide-react";
import { cn } from "~/lib/utils";
import { type Currency } from "~/services/currency.client";
import { type AmountSize, amounts } from "./amount";

function formatSats(amount: number) {
  // TODO: short format
  return amount;
}

function formatBTC(amount: number) {
  const formatter = new Intl.NumberFormat("en", {
    minimumFractionDigits: 8,
    maximumFractionDigits: 8,
    currency: "XBT",
    style: "currency",
  });
  return formatter
    .format(amount * 1e-8)
    .replace("XBT", "")
    .trim();
}

export default function SatsAmount({
  amount,
  size = "lg",
  currency = "sats",
  className,
}: {
  amount: number;
  size?: AmountSize;
  currency?: "sats" | "BTC";
  className?: string;
}) {
  const { wrapper, icon, text } = amounts[size];
  const value = currency === "sats" ? formatSats(amount) : formatBTC(amount);
  return (
    <div className={cn(wrapper, className)}>
      {currency === "sats" ? (
        <Zap className={icon} />
      ) : (
        <Bitcoin className={icon} />
      )}
      <span className={text}>
        <NumberFlow value={Number(value)} />
      </span>
    </div>
  );
}
