export type AmountSize = "sm" | "lg" | "xl";
export type AmountProps = {
  wrapper: string;
  icon: string;
  text: string;
};

export const amounts: Record<AmountSize, AmountProps> = {
  sm: {
    wrapper: "flex flex-row items-center gap-1",
    icon: "size-3 text-muted-foreground",
    text: "font-mono text-sm",
  },
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
