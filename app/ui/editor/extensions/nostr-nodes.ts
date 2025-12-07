import { Node, mergeAttributes } from "@tiptap/core";
import type { EventPointer, AddressPointer } from "nostr-tools/nip19";

// NEvent Node - for nevent and note references
export const NEventNode = Node.create({
  name: "nevent",
  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return {
      id: {
        default: null,
      },
      kind: {
        default: null,
      },
      author: {
        default: null,
      },
      relays: {
        default: [],
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-type='nevent']",
        getAttrs: (dom) => {
          if (typeof dom === "string") return false;
          const element = dom as HTMLElement;
          return {
            id: element.getAttribute("data-id"),
            kind: element.getAttribute("data-kind")
              ? Number(element.getAttribute("data-kind"))
              : null,
            author: element.getAttribute("data-author"),
            relays: element.getAttribute("data-relays")
              ? JSON.parse(element.getAttribute("data-relays")!)
              : [],
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(
        {
          "data-type": "nevent",
          "data-id": HTMLAttributes.id,
          "data-kind": HTMLAttributes.kind,
          "data-author": HTMLAttributes.author,
          "data-relays": JSON.stringify(HTMLAttributes.relays || []),
        },
        HTMLAttributes,
      ),
    ];
  },
});

// NAddr Node - for naddr references
export const NAddrNode = Node.create({
  name: "naddr",
  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return {
      identifier: {
        default: null,
      },
      kind: {
        default: null,
      },
      pubkey: {
        default: null,
      },
      relays: {
        default: [],
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-type='naddr']",
        getAttrs: (dom) => {
          if (typeof dom === "string") return false;
          const element = dom as HTMLElement;
          return {
            identifier: element.getAttribute("data-identifier"),
            kind: element.getAttribute("data-kind")
              ? Number(element.getAttribute("data-kind"))
              : null,
            pubkey: element.getAttribute("data-pubkey"),
            relays: element.getAttribute("data-relays")
              ? JSON.parse(element.getAttribute("data-relays")!)
              : [],
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(
        {
          "data-type": "naddr",
          "data-identifier": HTMLAttributes.identifier,
          "data-kind": HTMLAttributes.kind,
          "data-pubkey": HTMLAttributes.pubkey,
          "data-relays": JSON.stringify(HTMLAttributes.relays || []),
        },
        HTMLAttributes,
      ),
    ];
  },
});
