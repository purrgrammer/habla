import { kinds, type NostrEvent } from "nostr-tools";
import {
  type ProfileContent,
  getDisplayName,
  getProfilePicture,
  getArticleTitle,
  getArticleImage,
  getArticleSummary,
  getArticlePublished,
} from "applesauce-core/helpers";
import { COMMENT } from "./const";

interface MetaTag {
  title?: string;
  name?: string;
  property?: string;
  content?: string;
  type?: string;
  rel?: string;
  href?: string;
}

interface SeoOptions {
  title: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  publishedTime?: string;
  author?: string;
  siteName?: string;
}

export const DEFAULT_SITE_NAME = "Habla";
export const DEFAULT_SITE_DESCRIPTION =
  "Read, Highlight, Write, Bookmark, Earn";
export const DEFAULT_IMAGE = "https://habla.news/og.png";

export function buildBaseSeoTags(options: SeoOptions): MetaTag[] {
  const {
    title,
    description = DEFAULT_SITE_DESCRIPTION,
    image = DEFAULT_IMAGE,
    url,
    type = "website",
    publishedTime,
    author,
    siteName = DEFAULT_SITE_NAME,
  } = options;

  const tags: MetaTag[] = [
    { title },
    { name: "description", content: description },

    ...ESSENTIAL,

    // Open Graph tags
    { property: "og:title", content: title },
    { property: "og:site_name", content: siteName },
    { property: "og:type", content: type },
    { property: "og:image", content: image },
    { property: "og:image:alt", content: title },

    // Twitter Cards
    {
      name: "twitter:card",
      content: image ? "summary_large_image" : "summary",
    },
    { name: "twitter:title", content: title },
  ];

  if (description) {
    tags.push(
      { property: "og:description", content: description },
      { name: "twitter:description", content: description },
    );
  }

  if (url) {
    tags.push(
      { property: "og:url", content: url },
      { rel: "canonical", href: url },
    );
  }

  if (image) {
    tags.push({ name: "twitter:image", content: image });
  }

  if (publishedTime && type === "article") {
    tags.push({ property: "article:published_time", content: publishedTime });
  }

  if (author && type === "article") {
    tags.push({ property: "article:author", content: author });
  }

  return tags;
}

const ESSENTIAL = [
  { name: "theme-color", content: "#7c3aed" },
  { name: "color-scheme", content: "light dark" },
  { name: "robots", content: "index, follow" },
  { name: "language", content: "en" },
];

export default [
  { title: DEFAULT_SITE_NAME },
  { name: "description", content: DEFAULT_SITE_DESCRIPTION },

  // Essential meta tags
  ...ESSENTIAL,
  //{ name: "author", content: "Habla" },

  // Open Graph tags
  { property: "og:title", content: DEFAULT_SITE_NAME },
  { property: "og:description", content: DEFAULT_SITE_DESCRIPTION },
  { property: "og:type", content: "website" },
  { property: "og:site_name", content: DEFAULT_SITE_NAME },
  { property: "og:image", content: DEFAULT_IMAGE },
  { property: "og:locale", content: "en_US" },

  // Twitter Cards
  { name: "twitter:card", content: "summary_large_image" },
  { name: "twitter:title", content: DEFAULT_SITE_NAME },
  { name: "twitter:description", content: DEFAULT_SITE_DESCRIPTION },
  { name: "twitter:image", content: DEFAULT_IMAGE },
];

export function profileMeta(
  pubkey: string,
  profile: ProfileContent,
  url?: string,
) {
  const title = getDisplayName(profile) || pubkey;
  const description = profile?.about;
  const image = getProfilePicture(profile);

  return buildBaseSeoTags({
    title,
    description,
    image,
    url,
    type: "profile",
  });
}

export function articleMeta(
  event: NostrEvent,
  author: ProfileContent,
  url?: string,
) {
  const title = `${getArticleTitle(event)} - ${getDisplayName(author)}`;
  const description = getArticleSummary(event);
  const image = getArticleImage(event);
  // todo: author URL
  const publishedTimeRaw = getArticlePublished(event);
  const publishedTime = publishedTimeRaw
    ? new Date(parseInt(publishedTimeRaw.toString()) * 1000).toISOString()
    : undefined;
  const authorName = getDisplayName(author);

  return buildBaseSeoTags({
    title,
    description,
    image,
    url,
    type: "article",
    publishedTime,
    author: authorName,
  });
}

export function relayMeta(relayUrl: string, url?: string) {
  const title = `${relayUrl} - Relay`;
  const description = `Browse posts and discover content from the ${relayUrl} Nostr relay`;

  return buildBaseSeoTags({
    title,
    description,
    url,
    type: "website",
  });
}

export function tagMeta(tag: string, url?: string) {
  const title = `#${tag}`;
  const description = `Explore posts tagged with #${tag} on Habla`;

  return buildBaseSeoTags({
    title,
    description,
    url,
    type: "website",
  });
}

const eventKinds: Record<number, any> = {
  [kinds.ShortTextNote]: {
    title: "Note",
  },
  [kinds.Zap]: {
    title: "Zap",
  },
  [kinds.Highlights]: {
    title: "Highlight",
  },
  [COMMENT]: {
    title: "Comment",
  },
};

export function eventMeta(
  event: NostrEvent,
  profile?: ProfileContent,
  url?: string,
) {
  const { title } = eventKinds[event.kind] || { title: `Kind ${event.kind}` };
  const name = getDisplayName(profile) || event.pubkey;
  const image = getProfilePicture(profile);

  return buildBaseSeoTags({
    title: `${title} by ${name}`,
    description: event.content, // TODO: trim?
    image,
    url,
    //type: ""
  });
}
