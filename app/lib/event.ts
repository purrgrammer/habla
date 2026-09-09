import { kinds, type NostrEvent } from "nostr-tools";
import { getReplaceableAddress, isReplaceable } from "applesauce-core/helpers";
import { getZapSender } from "applesauce-common/helpers";

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
 */
export function displayPubkey(event: NostrEvent): string {
  return (
    (event.kind === kinds.Zap ? getZapSender(event) : undefined) ?? event.pubkey
  );
}
