export const HABLA_PUBKEY =
  "6ebdb5012662e2920ad9a74303bbff61c5ea205b8396f5cd1fae2a258c63be1b";

export const HABLA_REPO_URL = "https://github.com/purrgrammer/habla";
export const HABLA_CHAT_URL =
  "https://chachi.chat/groups.0xchat.com/dBhLDxUjJUyLDbYt";

export const BOOK = 30_040;
export const BOOK_CHAPTER = 30_041;

/**
 * Relays that exist to answer "where does this pubkey publish, and who are
 * they" — kinds 0, 3 and 10002. They hold replaceable events and little else,
 * so asking them is cheap and drags no firehose behind it. More than one on
 * purpose: a single indexer is both a privacy funnel and a single point of
 * failure for every profile on the site.
 */
export const INDEX_RELAYS = [
  "wss://purplepag.es",
  "wss://user.kindpag.es",
  "wss://indexer.coracle.social",
  "wss://relay.vertexlab.io",
];
export const AGGREGATOR_RELAYS = [
  "wss://relay.damus.io",
  "wss://nos.lol",
  "wss://relay.primal.net",
];

export const BIG_ZAP_AMOUNT = 21_000;

export const COMMENT = 1111;
export const BLOSSOM_SERVER_LIST_KIND = 10063;
