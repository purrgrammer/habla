import type { NostrEvent } from "nostr-tools";
import Article from "~/ui/nostr/article";
import { faq } from "~/featured";
import { DEFAULT_SITE_NAME, buildBaseSeoTags } from "~/seo";
import { getTagValue } from "applesauce-core/helpers";

export function meta() {
  return buildBaseSeoTags({
    title: DEFAULT_SITE_NAME,
    description: "Frequently asked questions",
    url: "https://habla.news/faq",
    type: "website",
  });
}

export default function FAQ() {
  const address = {
    kind: faq.kind,
    pubkey: faq.pubkey,
    identifier: getTagValue(faq, "d") || "",
  };
  return <Article event={faq as NostrEvent} relays={[]} address={address} />;
}
