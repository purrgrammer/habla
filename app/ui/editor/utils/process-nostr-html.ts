import { nip19 } from "nostr-tools";

/**
 * Process HTML content to convert nostr: links into proper nodes
 */
export function processNostrHTML(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const nostrPattern = /nostr:(npub|nprofile|nevent|note|naddr)1[a-z0-9]+/gi;

  function createReplacementElement(nostrLink: string): HTMLElement | null {
    try {
      const nostrId = nostrLink.replace(/^nostr:/, "");
      const decoded = nip19.decode(nostrId);

      if (decoded.type === "npub" || decoded.type === "nprofile") {
        const span = doc.createElement("span");
        span.setAttribute("data-type", "mention");
        span.setAttribute(
          "data-pubkey",
          decoded.type === "npub" ? decoded.data : decoded.data.pubkey,
        );
        span.setAttribute("data-name", "user");
        span.setAttribute(
          "data-relays",
          decoded.type === "nprofile"
            ? JSON.stringify(decoded.data.relays || [])
            : "[]",
        );
        span.textContent = "@user";
        return span;
      }

      if (decoded.type === "nevent" || decoded.type === "note") {
        const span = doc.createElement("span");
        span.setAttribute("data-type", "nevent");
        span.setAttribute(
          "data-id",
          decoded.type === "nevent" ? decoded.data.id : decoded.data,
        );
        span.setAttribute(
          "data-kind",
          decoded.type === "nevent" ? String(decoded.data.kind || "") : "1",
        );
        span.setAttribute(
          "data-author",
          decoded.type === "nevent" ? decoded.data.author || "" : "",
        );
        span.setAttribute(
          "data-relays",
          decoded.type === "nevent"
            ? JSON.stringify(decoded.data.relays || [])
            : "[]",
        );
        return span;
      }

      if (decoded.type === "naddr") {
        const span = doc.createElement("span");
        span.setAttribute("data-type", "naddr");
        span.setAttribute("data-identifier", decoded.data.identifier);
        span.setAttribute("data-kind", String(decoded.data.kind));
        span.setAttribute("data-pubkey", decoded.data.pubkey);
        span.setAttribute(
          "data-relays",
          JSON.stringify(decoded.data.relays || []),
        );
        return span;
      }

      return null;
    } catch (error) {
      console.error("[processNostrHTML] Failed to parse:", nostrLink, error);
      return null;
    }
  }

  function processTextNode(node: Node) {
    if (node.nodeType === Node.TEXT_NODE && node.textContent) {
      const matches = Array.from(node.textContent.matchAll(nostrPattern));
      if (matches.length === 0) return;

      const fragment = doc.createDocumentFragment();
      let lastIndex = 0;

      matches.forEach((match) => {
        const matchIndex = match.index!;
        const nostrLink = match[0];

        // Add text before match
        if (matchIndex > lastIndex) {
          fragment.appendChild(
            doc.createTextNode(
              node.textContent!.substring(lastIndex, matchIndex),
            ),
          );
        }

        // Add replacement or keep original text
        const replacement = createReplacementElement(nostrLink);
        fragment.appendChild(replacement || doc.createTextNode(nostrLink));

        lastIndex = matchIndex + nostrLink.length;
      });

      // Add remaining text
      if (lastIndex < node.textContent.length) {
        fragment.appendChild(
          doc.createTextNode(node.textContent.substring(lastIndex)),
        );
      }

      node.parentNode?.replaceChild(fragment, node);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      Array.from(node.childNodes).forEach(processTextNode);
    }
  }

  processTextNode(doc.body);

  // Handle anchor tags with nostr: href
  doc.querySelectorAll('a[href^="nostr:"]').forEach((link) => {
    const href = link.getAttribute("href");
    if (!href) return;

    const replacement = createReplacementElement(href);
    if (replacement && replacement.getAttribute("data-type") === "mention") {
      // Preserve link text for mentions
      const linkText = link.textContent;
      if (linkText && !linkText.startsWith("nostr:")) {
        replacement.setAttribute("data-name", linkText);
        replacement.textContent = `@${linkText}`;
      }
    }

    if (replacement) {
      link.parentNode?.replaceChild(replacement, link);
    }
  });

  return doc.body.innerHTML;
}
