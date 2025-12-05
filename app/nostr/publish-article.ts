import type { NostrEvent } from "nostr-tools";
import type { Action } from "applesauce-actions";
import { kinds } from "nostr-tools";
import { nip19 } from "nostr-tools";
import { setSingletonTag } from "applesauce-factory/operations/tag";
import { modifyPublicTags } from "applesauce-factory/operations";
import { blossomMetadataStore } from "~/services/blossom/metadata-store.client";

interface PublishArticleParams {
  identifier: string;
  title: string;
  content: string;
  image?: string;
  summary?: string;
  hashtags?: string[];
  relays: string[];
  existingEvent?: NostrEvent;
}

/**
 * Extract title from markdown (first H1 heading)
 */
export function extractTitle(markdown: string): string {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : "Untitled";
}

/**
 * Extract content after first H1 heading
 */
export function extractContent(markdown: string): string {
  const lines = markdown.split("\n");
  let foundH1 = false;
  const contentLines: string[] = [];

  for (const line of lines) {
    if (!foundH1 && /^#\s+/.test(line)) {
      foundH1 = true;
      continue;
    }
    if (foundH1) {
      contentLines.push(line);
    }
  }

  return contentLines.join("\n").trim();
}

/**
 * Generate URL-safe identifier from title
 */
export function generateIdentifier(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

/**
 * Parse nostr mentions from content
 * Returns arrays of pubkeys, event IDs, and address pointers
 */
export function parseNostrMentions(content: string): {
  pubkeys: string[];
  eventIds: string[];
  addresses: string[];
} {
  const pubkeys: string[] = [];
  const eventIds: string[] = [];
  const addresses: string[] = [];

  // Match nostr: URIs
  const nostrRegex =
    /nostr:(npub1[a-z0-9]+|note1[a-z0-9]+|nprofile1[a-z0-9]+|nevent1[a-z0-9]+|naddr1[a-z0-9]+)/g;
  const matches = content.match(nostrRegex);

  if (matches) {
    for (const match of matches) {
      const nip19Str = match.replace("nostr:", "");

      try {
        const decoded = nip19.decode(nip19Str);

        switch (decoded.type) {
          case "npub":
            pubkeys.push(decoded.data);
            break;
          case "nprofile":
            pubkeys.push(decoded.data.pubkey);
            break;
          case "note":
            eventIds.push(decoded.data);
            break;
          case "nevent":
            eventIds.push(decoded.data.id);
            break;
          case "naddr":
            const { kind, pubkey, identifier } = decoded.data;
            addresses.push(`${kind}:${pubkey}:${identifier}`);
            break;
        }
      } catch (error) {
        console.error(
          "[publish] Failed to decode nostr mention:",
          nip19Str,
          error,
        );
      }
    }
  }

  return {
    pubkeys: Array.from(new Set(pubkeys)),
    eventIds: Array.from(new Set(eventIds)),
    addresses: Array.from(new Set(addresses)),
  };
}

/**
 * Extract Blossom image URLs and generate imeta tags
 */
export function extractBlossomImages(content: string): string[][] {
  const imetaTags: string[][] = [];

  // Match image URLs in markdown: ![alt](url)
  const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let match;

  while ((match = imgRegex.exec(content)) !== null) {
    const url = match[2];

    // Check if it's a Blossom URL and we have metadata
    const hash = extractHashFromBlossomUrl(url);
    if (hash) {
      const metadata = blossomMetadataStore.get(hash);
      if (metadata) {
        // Build imeta tag according to NIP-92
        const imetaTag = [
          "imeta",
          `url ${url}`,
          `m ${metadata.type}`,
          `x ${metadata.hash}`,
          `size ${metadata.size}`,
        ];

        if (metadata.blurhash) {
          imetaTag.push(`blurhash ${metadata.blurhash}`);
        }

        imetaTags.push(imetaTag);
      }
    }
  }

  return imetaTags;
}

function extractHashFromBlossomUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const filename = urlObj.pathname.split("/").pop();
    if (filename) {
      // Remove extension to get hash
      return filename.split(".")[0];
    }
  } catch (error) {
    // Not a valid URL
  }
  return null;
}

/**
 * Deduplicate tags while preserving order
 */
function deduplicateTags(tags: string[][]): string[][] {
  const seen = new Set<string>();
  const result: string[][] = [];

  for (const tag of tags) {
    const key = JSON.stringify(tag);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(tag);
    }
  }

  return result;
}

/**
 * PublishArticle action
 * Creates a kind 30023 Long-form Content event with all appropriate tags
 */
export function PublishArticle({
  identifier,
  title,
  content,
  image,
  summary,
  hashtags = [],
  relays,
  existingEvent,
}: PublishArticleParams): Action {
  return async function* ({ factory }: any) {
    const tags: string[][] = [];

    // Required tags
    tags.push(["d", identifier]);
    tags.push(["title", title]);

    // Use original published_at if updating, otherwise use current time
    const publishedAt = existingEvent
      ? existingEvent.tags.find((t) => t[0] === "published_at")?.[1]
      : undefined;
    tags.push([
      "published_at",
      publishedAt || String(Math.floor(Date.now() / 1000)),
    ]);

    // Optional metadata tags
    if (image) {
      tags.push(["image", image]);
    }
    if (summary) {
      tags.push(["summary", summary]);
    }

    // Parse nostr mentions and add tags
    const mentions = parseNostrMentions(content);
    mentions.pubkeys.forEach((pubkey) => {
      tags.push(["p", pubkey]);
    });
    mentions.eventIds.forEach((eventId) => {
      tags.push(["e", eventId]);
    });
    mentions.addresses.forEach((address) => {
      tags.push(["a", address]);
    });

    // Extract Blossom images and add imeta tags
    const imetaTags = extractBlossomImages(content);
    tags.push(...imetaTags);

    // Add hashtags
    hashtags.forEach((tag) => {
      tags.push(["t", tag.toLowerCase()]);
    });

    // Preserve existing zap tags if updating
    if (existingEvent) {
      const zapTags = existingEvent.tags.filter(
        (tag: string[]) => tag[0] === "zap",
      );
      tags.push(...zapTags);

      // Preserve existing t tags and merge with new ones
      const existingTTags = existingEvent.tags.filter(
        (tag: string[]) => tag[0] === "t",
      );
      tags.push(...existingTTags);
    }

    // Deduplicate all tags
    const uniqueTags = deduplicateTags(tags);

    const draft = await factory.build({
      kind: kinds.LongFormArticle,
      content,
      tags: uniqueTags,
    });

    yield await factory.sign(draft);
  };
}
