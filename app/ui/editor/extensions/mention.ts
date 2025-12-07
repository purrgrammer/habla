import { Node, mergeAttributes } from "@tiptap/core";
import type { ProfilePointer } from "nostr-tools/nip19";

export type MentionOptions = {
  HTMLAttributes: Record<string, any>;
  renderLabel: (props: { node: any }) => string;
};

const NostrMention = Node.create<MentionOptions>({
  name: "mention",

  addOptions() {
    return {
      HTMLAttributes: {},
      renderLabel({ node }) {
        return `@${node.attrs.name}`;
      },
    };
  },

  group: "inline",
  inline: true,
  selectable: false,
  atom: true,

  addAttributes() {
    return {
      pubkey: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-pubkey"),
        renderHTML: (attributes) => {
          if (!attributes.pubkey) {
            return {};
          }
          return {
            "data-pubkey": attributes.pubkey,
          };
        },
      },
      name: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-name"),
        renderHTML: (attributes) => {
          if (!attributes.name) {
            return {};
          }
          return {
            "data-name": attributes.name,
          };
        },
      },
      relays: {
        default: [],
        parseHTML: (element) => {
          const relays = element.getAttribute("data-relays");
          return relays ? JSON.parse(relays) : [];
        },
        renderHTML: (attributes) => {
          if (!attributes.relays || attributes.relays.length === 0) {
            return {};
          }
          return {
            "data-relays": JSON.stringify(attributes.relays),
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: `span[data-type="${this.name}"]`,
      },
      // Parse markdown-style nostr: links as mentions
      {
        tag: "a[href^='nostr:npub']",
        getAttrs: (dom) => {
          if (typeof dom === "string") return false;
          const element = dom as HTMLElement;
          const href = element.getAttribute("href");
          if (!href) return false;

          try {
            const { nip19 } = require("nostr-tools");
            const nostrId = href.replace(/^nostr:/, "");
            const decoded = nip19.decode(nostrId);

            if (decoded.type === "npub") {
              return {
                pubkey: decoded.data,
                name: element.textContent || "user",
                relays: [],
              };
            } else if (decoded.type === "nprofile") {
              return {
                pubkey: decoded.data.pubkey,
                name: element.textContent || "user",
                relays: decoded.data.relays || [],
              };
            }
          } catch (e) {
            return false;
          }
          return false;
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(
        { "data-type": this.name },
        this.options.HTMLAttributes,
        HTMLAttributes,
      ),
      this.options.renderLabel({ node }),
    ];
  },

  renderText({ node }) {
    return this.options.renderLabel({ node });
  },
});

export default NostrMention;
