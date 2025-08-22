import { type NostrEvent, kinds } from "nostr-tools";
import { type ComponentMap, useRenderedContent } from "applesauce-react/hooks";
import InlineEmoji from "~/ui/inline-emoji";
import UserLink from "./user-link";
import NEvent from "~/ui/nostr/nevent";
import NAddr from "~/ui/nostr/naddr";
import A from "~/ui/a";
import Hashtag from "~/ui/hashtag";

const components: ComponentMap = {
  text: ({ node }) => <span>{node.value}</span>,
  link: ({ node }) => <A {...node} />,
  //cashu: Cashu,
  emoji: ({ node }) => <InlineEmoji url={node.url} code={node.code} />,
  hashtag: ({ node }) => <Hashtag {...node} />,
  mention: ({ node }) => {
    if (node.decoded.type === "nevent") {
      return <NEvent {...node.decoded.data} />;
    }
    if (node.decoded.type === "note") {
      return <NEvent id={node.decoded.data} kind={kinds.ShortTextNote} />;
    }
    if (node.decoded.type === "naddr") {
      return <NAddr {...node.decoded.data} />;
    }
    if (node.decoded.type === "npub") {
      return (
        <UserLink
          pubkey={node.decoded.data}
          wrapper="inline-block"
          name="text-primary"
          img="size-6 -mt-1"
        />
      );
    }
    if (node.decoded.type === "nprofile") {
      return (
        <UserLink
          pubkey={node.decoded.data.pubkey}
          relays={node.decoded.data.relays}
          wrapper="inline-block"
          name="text-primary"
          img="size-6 -mt-1"
        />
      );
    }
    return null;
  },
  //gallery: ({ node }) => <Debug>{node}</Debug>, //<ImageGallery images={node.links} />,
  //lightning: ({ node }) => <LightningInvoice invoice={node.invoice} />,
};

export default function RichText({
  event,
  content,
}: {
  event?: NostrEvent;
  content?: string;
}) {
  if (!event && !content) return null;
  return useRenderedContent(
    content && event ? { ...event, content } : event ? event : content || "",
    components,
  );
}
