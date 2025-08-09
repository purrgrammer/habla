import { type ReactNode } from "react";
import { kinds, nip19 } from "nostr-tools";
import { Link } from "react-router";
import { remarkNostrMentions } from "applesauce-content/markdown";
import {
  default as ReactMarkdown,
  type Components,
  type ExtraProps,
  defaultUrlTransform,
} from "react-markdown";
import UserLink from "~/ui/nostr/user-link";
import NEvent from "~/ui/nostr/nevent";
import NAddr from "~/ui/nostr/naddr";
import remarkGfm from "remark-gfm";
import A from "~/ui/a";

function MarkdownLink({
  children,
  node,
  href,
  ...props
}: { href?: string; children?: ReactNode } & ExtraProps) {
  const properties: { className?: string } | undefined = node?.properties;

  //if (properties?.className?.includes("internal") && properties.href) {
  //  return (
  //    <WikiLink href={href} node={node} {...props}>
  //      {children}
  //    </WikiLink>
  //  );
  //}
  if (!href) return null;

  // render nostr: mentions
  if (href.startsWith("nostr:")) {
    try {
      const parsed = nip19.decode(href.replace(/^nostr:/, ""));

      switch (parsed.type) {
        case "npub":
          return (
            <UserLink
              pubkey={parsed.data}
              wrapper="inline-block"
              name="font-serif text-primary"
              img="size-6 -mt-1"
            />
          );
        case "nprofile":
          return (
            <UserLink
              pubkey={parsed.data.pubkey}
              relays={parsed.data.relays}
              wrapper="inline-block"
              name="font-serif text-primary"
              img="size-6 -mt-1"
            />
          );

        case "nevent":
          return <NEvent {...parsed.data} />;

        case "note":
          return <NEvent kind={kinds.ShortTextNote} id={parsed.data} />;

        case "naddr":
          return <NAddr {...parsed.data} />;
      }
    } catch (error) {
      if (error instanceof Error) return <>error.message</>;
    }
  }

  return <A href={href} value={children} />;
}

// TODO: footnote navigation
const components: Partial<Components> = {
  a: MarkdownLink,
};

function urlTransform(url: string) {
  if (url.startsWith("nostr:")) return url;
  return defaultUrlTransform(url);
}

export default function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkNostrMentions]}
      skipHtml
      components={components}
      urlTransform={urlTransform}
    >
      {children}
    </ReactMarkdown>
  );
}
