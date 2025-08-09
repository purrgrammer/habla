import { type NostrEvent } from "nostr-tools";
import InlineEmoji from "../inline-emoji";

export default function EmojiSet({ event }: { event: NostrEvent }) {
  const emojis = event.tags
    .filter((t) => t[0] === "emoji")
    .map((t) => {
      const [, name, img] = t;
      return { name, img };
    });
  return (
    <section
      className="grid grid-cols-6 
    xsm:grid-cols-8
    sm:grid-cols-12 
    lg:grid-cols-16
    gap-1"
    >
      {emojis.map((e) => (
        <InlineEmoji key={e.name} url={e.img} code={e.name} />
      ))}
    </section>
  );
}
