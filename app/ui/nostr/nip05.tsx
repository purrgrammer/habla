import { useNip05 } from "~/nostr/queries";
import PureNip05, { type Nip05Props } from "./pure-nip05";

export function Invalid({ nip05, className = "text-sm" }: Nip05Props) {
  return (
    <PureNip05
      nip05={nip05}
      isLoading={false}
      isVerified={false}
      className={className}
    />
  );
}

export function Loading({ nip05, className = "text-sm" }: Nip05Props) {
  return (
    <PureNip05
      nip05={nip05}
      isLoading={false}
      isVerified={false}
      className={className}
    />
  );
}

export default function Nip05({
  pubkey,
  nip05,
  className,
}: {
  pubkey: string;
  nip05: string;
  className?: string;
}) {
  const { isLoading, data: pointer } = useNip05(nip05);
  return (
    <PureNip05
      nip05={nip05}
      isLoading={isLoading}
      isVerified={Boolean(pointer && pointer.pubkey === pubkey)}
      className={className}
    />
  );
}
