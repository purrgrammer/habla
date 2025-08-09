import { type NostrEvent } from "nostr-tools";
import {
  type ProfileContent,
  getDisplayName,
  getProfilePicture,
  getArticleTitle,
  getArticleImage,
  getArticleSummary,
  getArticlePublished,
} from "applesauce-core/helpers";

export default [
  { title: "Habla" },
  { name: "description", content: "read, highlight, write, earn" },
];

export function profileMeta(pubkey: string, profile: ProfileContent) {
  const title = getDisplayName(profile) || pubkey;
  const description = profile?.about;
  const image = getProfilePicture(profile);

  // TODO: author og meta tags
  return [
    { title },
    { name: "og:title", content: title },
    { name: "og:type", content: "profile" },
    { name: "profile:username", content: title },
    ...(description
      ? [
          { name: "description", content: description },
          { name: "og:description", content: description },
        ]
      : []),
    // todo: image type
    ...(image ? [{ name: "og:image", content: image }] : []),
  ];
}

export function articleMeta(event: NostrEvent, author: ProfileContent) {
  const title = `${getArticleTitle(event)} - ${getDisplayName(author)}`;
  const description = getArticleSummary(event);
  const image = getArticleImage(event);
  const publishedAt = getArticlePublished(event);
  return [
    { title },
    { name: "og:title", content: title },
    { name: "og:type", content: "article" },
    ...(description
      ? [
          { name: "description", content: description },
          { name: "og:description", content: description },
        ]
      : []),
    ...(image ? [{ name: "og:image", content: image }] : []),
  ];
}
