import type { Action } from "applesauce-actions";
import type { NostrEvent } from "nostr-tools";
import { kinds } from "nostr-tools";
import {
  getAddressPointerForEvent,
  getInboxes,
  getTagValue,
  isReplaceable,
} from "applesauce-core/helpers";
import {
  addAddressTag,
  addEventTag,
  addPubkeyTag,
  setSingletonTag,
} from "applesauce-factory/operations/tag";
import { modifyPublicTags } from "applesauce-factory/operations";
import { COMMENT } from "~/const";

export function ZapRequest({
  amount,
  pubkey,
  event,
  lnurl,
  message,
}: {
  amount: string; // in msats
  pubkey: string;
  event?: NostrEvent;
  lnurl?: string;
  message?: string;
}): Action {
  return async function* ({ events, factory, self }) {
    const otherRelayList = events.getReplaceable(kinds.RelayList, pubkey);
    const otherRelays = otherRelayList ? getInboxes(otherRelayList) : [];
    const myRelaysList =
      self === pubkey
        ? otherRelayList
        : events.getReplaceable(kinds.RelayList, self);
    const myRelays =
      self === pubkey
        ? otherRelays
        : myRelaysList
          ? getInboxes(myRelaysList)
          : [];
    const relays = otherRelays.concat(myRelays);
    const pointer = {
      pubkey,
      relays: otherRelays,
    };
    const draft = await factory.build(
      {
        kind: kinds.ZapRequest,
        content: message,
      },
      modifyPublicTags(
        ...[
          addPubkeyTag(pointer),
          setSingletonTag(["amount", amount]),
          setSingletonTag(["relays", ...relays]),
          ...(lnurl ? [setSingletonTag(["lnurl", lnurl])] : []),
          ...(event
            ? [addEventTag(event), setSingletonTag(["k", String(event.kind)])]
            : []),
          ...(event && isReplaceable(event.kind)
            ? [addAddressTag(getAddressPointerForEvent(event))]
            : []),
        ],
      ),
    );
    yield await factory.sign(draft);
  };
}

export function Comment({
  message,
  event,
}: {
  event: NostrEvent;
  message: string;
}): Action {
  return async function* ({ events, factory, self }) {
    const otherRelayList = events.getReplaceable(kinds.RelayList, event.pubkey);
    const otherRelays = otherRelayList ? getInboxes(otherRelayList) : [];
    const myRelaysList =
      self === event.pubkey
        ? otherRelayList
        : events.getReplaceable(kinds.RelayList, self);
    const myRelays =
      self === event.pubkey
        ? otherRelays
        : myRelaysList
          ? getInboxes(myRelaysList)
          : [];
    const relays = otherRelays.concat(myRelays);
    const pointer = {
      pubkey: event.pubkey,
      relays: otherRelays,
    };
    const K =
      event.tags.find((tag) => tag[0] === "K")?.[1] || String(event.kind);
    const E =
      event.tags.find((tag) => tag[0] === "E")?.[1] || isReplaceable(event.kind)
        ? null
        : event.id;
    const A =
      event.tags.find((tag) => tag[0] === "A")?.[1] || isReplaceable(event.kind)
        ? `${event.kind}:${event.pubkey}:${getTagValue(event, "d") || ""}`
        : null;
    const draft = await factory.build(
      {
        kind: COMMENT,
        content: message,
      },
      modifyPublicTags(
        ...[
          addPubkeyTag(pointer),
          addEventTag(event),
          setSingletonTag(["K", K]),
          ...(A
            ? [setSingletonTag(["A", A])]
            : E
              ? [setSingletonTag(["E", E])]
              : []),
          setSingletonTag(["k", String(event.kind)]),
          ...(event && isReplaceable(event.kind)
            ? [addAddressTag(getAddressPointerForEvent(event))]
            : []),
        ],
      ),
    );
    yield await factory.sign(draft);
  };
}
