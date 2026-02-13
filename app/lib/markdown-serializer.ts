/**
 * Centralized markdown serialization configuration for TipTap.
 *
 * This provides custom node mappings that ensure proper spacing between
 * block elements, eliminating the need for regex post-processing.
 */

import type { JSONContent } from "@tiptap/core";
import { nip19 } from "nostr-tools";

type NodeHandler = (
  node: JSONContent,
  helpers: {
    renderChildren: (content?: JSONContent[]) => string;
  },
) => string;

type NodeMapping = Record<string, NodeHandler>;

/**
 * Helper to render children nodes to markdown
 */
function createRenderChildren(
  nodeMapping: NodeMapping,
): (content?: JSONContent[]) => string {
  return function renderChildren(content?: JSONContent[]): string {
    if (!content) return "";
    return content.map((child) => renderNode(child, nodeMapping)).join("");
  };
}

/**
 * Render a single node to markdown
 */
function renderNode(node: JSONContent, nodeMapping: NodeMapping): string {
  const handler = nodeMapping[node.type || ""];
  if (handler) {
    const helpers = { renderChildren: createRenderChildren(nodeMapping) };
    return handler(node, helpers);
  }

  // Default: render children if present, otherwise return empty
  if (node.content) {
    // Log warning for unhandled node types (except common structural ones)
    if (node.type && !["doc"].includes(node.type)) {
      console.warn(
        `[markdown-serializer] Unknown node type: ${node.type}. Content will be rendered without formatting.`,
      );
    }
    const helpers = { renderChildren: createRenderChildren(nodeMapping) };
    return helpers.renderChildren(node.content);
  }

  // Log warning for completely unhandled nodes (without content or text)
  if (node.type && node.type !== "text") {
    console.warn(
      `[markdown-serializer] Unhandled node type: ${node.type}. Node will be skipped.`,
    );
  }

  return "";
}

/**
 * Helper to render a list item, handling nested lists with proper indentation
 */
function renderListItem(
  item: JSONContent,
  marker: string,
  helpers: { renderChildren: (content?: JSONContent[]) => string },
): string {
  const parts: string[] = [];
  let firstParagraph = true;

  for (const child of item.content || []) {
    if (child.type === "paragraph") {
      const content = helpers.renderChildren(child.content);
      if (firstParagraph) {
        parts.push(`${marker} ${content.trim()}`);
        firstParagraph = false;
      } else {
        // Additional paragraphs in same list item
        parts.push(`  ${content.trim()}`);
      }
    } else if (child.type === "bulletList" || child.type === "orderedList") {
      // Nested list - indent each line
      const nestedContent = helpers.renderChildren([child]);
      const indented = nestedContent
        .trim()
        .split("\n")
        .map((line) => `  ${line}`)
        .join("\n");
      parts.push(indented);
    } else {
      // Other content types
      const content = helpers.renderChildren([child]);
      parts.push(`  ${content.trim()}`);
    }
  }

  return parts.join("\n");
}

/**
 * Node mappings with proper block spacing.
 * Each block element ends with \n\n to ensure separation.
 */
export const nodeMapping: NodeMapping = {
  doc: (node, helpers) => {
    return helpers.renderChildren(node.content);
  },

  paragraph: (node, helpers) => {
    const content = helpers.renderChildren(node.content);
    if (!content.trim()) return "\n";
    return `${content}\n\n`;
  },

  heading: (node, helpers) => {
    const level = node.attrs?.level || 1;
    const prefix = "#".repeat(level);
    const content = helpers.renderChildren(node.content);
    return `${prefix} ${content}\n\n`;
  },

  blockquote: (node, helpers) => {
    const content = helpers.renderChildren(node.content);
    // Wrap each line with >
    const lines = content.trim().split("\n");
    const quoted = lines.map((line) => `> ${line}`).join("\n");
    return `${quoted}\n\n`;
  },

  codeBlock: (node, helpers) => {
    const language = node.attrs?.language || "";
    const content = helpers.renderChildren(node.content);
    return `\`\`\`${language}\n${content}\n\`\`\`\n\n`;
  },

  bulletList: (node, helpers) => {
    const items = (node.content || [])
      .map((item) => {
        return renderListItem(item, "-", helpers);
      })
      .join("\n");
    return `${items}\n\n`;
  },

  orderedList: (node, helpers) => {
    const items = (node.content || [])
      .map((item, index) => {
        return renderListItem(item, `${index + 1}.`, helpers);
      })
      .join("\n");
    return `${items}\n\n`;
  },

  listItem: (node, helpers) => {
    // Handled by bulletList/orderedList
    return helpers.renderChildren(node.content);
  },

  image: (node) => {
    const { src, alt, title } = node.attrs || {};
    const altText = alt || "";
    const titleAttr = title ? ` "${title}"` : "";
    return `![${altText}](${src || ""}${titleAttr})\n\n`;
  },

  horizontalRule: () => {
    return `---\n\n`;
  },

  hardBreak: () => {
    return "\n";
  },

  // Nostr-specific nodes
  mention: (node) => {
    const { pubkey, relays } = node.attrs || {};
    const identifier =
      relays && relays.length > 0
        ? nip19.nprofileEncode({ pubkey, relays })
        : nip19.npubEncode(pubkey);
    return `nostr:${identifier}`;
  },

  nevent: (node) => {
    const { id, kind, author, relays } = node.attrs || {};
    const identifier = nip19.neventEncode({
      id,
      kind: kind || undefined,
      author: author || undefined,
      relays: relays || [],
    });
    return `nostr:${identifier}`;
  },

  naddr: (node) => {
    const { identifier, kind, pubkey, relays } = node.attrs || {};
    const naddrId = nip19.naddrEncode({
      identifier,
      kind,
      pubkey,
      relays: relays || [],
    });
    return `nostr:${naddrId}`;
  },

  text: (node) => {
    let text = node.text || "";
    if (node.marks) {
      // Apply marks in a defined order so nesting is deterministic:
      // innermost first: code, highlight, strike, italic, bold, underline, link (outermost)
      const markOrder = [
        "code",
        "highlight",
        "strike",
        "italic",
        "bold",
        "underline",
        "link",
      ];
      const sorted = [...node.marks].sort(
        (a, b) =>
          markOrder.indexOf(a.type || "") - markOrder.indexOf(b.type || ""),
      );
      for (const mark of sorted) {
        switch (mark.type) {
          case "bold":
            text = `**${text}**`;
            break;
          case "italic":
            text = `*${text}*`;
            break;
          case "code":
            text = `\`${text}\``;
            break;
          case "strike":
            text = `~~${text}~~`;
            break;
          case "link":
            text = `[${text}](${mark.attrs?.href || ""})`;
            break;
          case "underline":
            text = `<u>${text}</u>`;
            break;
          case "highlight":
            text = `==${text}==`;
            break;
        }
      }
    }
    return text;
  },
};

/**
 * Render TipTap JSON content to markdown with proper block spacing.
 */
export function renderToMarkdownWithSpacing(content: JSONContent): string {
  const result = renderNode(content, nodeMapping);
  // Trim trailing whitespace but preserve structure
  return result.trim();
}
