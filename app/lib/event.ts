import { kinds, type NostrEvent } from "nostr-tools";
import { getReplaceableAddress, isReplaceable } from "applesauce-core/helpers";
import { getZapRequest, getZapSender } from "applesauce-common/helpers";

/**
 * The stable identifier to tag or filter an event by: its `kind:pubkey:d`
 * address when it is replaceable, its id otherwise.
 *
 * applesauce v6 returns `null` from `getReplaceableAddress` for non-replaceable
 * events, so this collapses the two cases into the one string callers want.
 */
export function addressOrId(event: NostrEvent): string {
  return (
    (isReplaceable(event.kind) ? getReplaceableAddress(event) : null) ??
    event.id
  );
}

/**
 * Who to show as the author of an event. For a zap receipt that is whoever
 * sent the zap, not the relay-side wallet that published the receipt.
 *
 * The zap request in the `description` tag comes first, and the order is the
 * point. That request is a signed kind-9734 and applesauce verifies the
 * signature before handing it over, so its `pubkey` is a claim the sender
 * actually made. The `P` tag is plain metadata written by whoever published
 * the receipt, with nothing to check it against — a wallet can put any pubkey
 * there and Habla would print that person's name under someone else's zap.
 *
 * `getZapSender` reads `P` first (`getTagValue(zap, "P") || request?.pubkey`),
 * which is why this does not simply call it: it is the fallback for a receipt
 * that carries no description, not the primary source.
 */
export function displayPubkey(event: NostrEvent): string {
  if (event.kind !== kinds.Zap) return event.pubkey;
  return getZapRequest(event)?.pubkey ?? getZapSender(event) ?? event.pubkey;
}
