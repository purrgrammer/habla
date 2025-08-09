import { type AddressPointer } from "nostr-tools/nip19";
import ClientNAddr from "~/ui/nostr/naddr.client";
import ClientOnly from "~/ui/client-only";
import NAddrLink from "./naddr-link";

export default function NAddr(props: AddressPointer & { className?: string }) {
  return (
    <ClientOnly fallback={<NAddrLink {...props} />}>
      {() => <ClientNAddr {...props} />}
    </ClientOnly>
  );
}
