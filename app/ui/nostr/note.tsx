import { type NostrEvent } from "nostr-tools";
//import { type ComponentMap, useRenderedContent } from "applesauce-react/hooks";
//import InlineEmoji from "~/ui/inline-emoji";
//import Debug from "~/ui/debug";
//import UserLink from "./user-link";
//import NEvent from "~/ui/nostr/nevent";
//import NAddr from "~/ui/nostr/naddr";
//import A from "~/ui/a";
import ClientOnly from "../client-only";
import RichText from "./rich-text";

export default function Note({ event }: { event: NostrEvent }) {
  return <ClientOnly>{() => <RichText event={event} />}</ClientOnly>;
}
