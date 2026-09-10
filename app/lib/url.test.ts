import { describe, it, expect } from "vitest";
import type { NostrEvent } from "nostr-tools";
import { prettify, getRelayURLs } from "./url";

function eventWithTags(tags: string[][]): NostrEvent {
  return {
    id: "0".repeat(64),
    pubkey: "1".repeat(64),
    created_at: 0,
    kind: 10002,
    tags,
    content: "",
    sig: "2".repeat(128),
  };
}

describe("prettify", () => {
  it("drops the scheme", () => {
    expect(prettify("https://example.com/post")).toBe("example.com/post");
    expect(prettify("http://example.com/post")).toBe("example.com/post");
  });

  it("drops one trailing slash", () => {
    expect(prettify("https://example.com/")).toBe("example.com");
  });

  it("leaves a non-http scheme alone", () => {
    expect(prettify("wss://relay.example.com")).toBe("wss://relay.example.com");
  });

  it("decodes percent-encoding so the text reads as written", () => {
    expect(prettify("https://example.com/a%20b")).toBe("example.com/a b");
  });

  it("falls back to the stripped string when the encoding is malformed", () => {
    // decodeURIComponent throws on a lone %; the caller still needs a string.
    expect(prettify("https://example.com/100%")).toBe("example.com/100%");
  });

  it("returns the original when stripping leaves nothing", () => {
    expect(prettify("https://")).toBe("https://");
  });
});

describe("getRelayURLs", () => {
  it("returns the r tags, normalised", () => {
    const event = eventWithTags([
      ["r", "wss://relay.damus.io"],
      ["r", "wss://nos.lol/"],
    ]);
    expect(getRelayURLs(event)).toEqual([
      "wss://relay.damus.io/",
      "wss://nos.lol/",
    ]);
  });

  it("ignores tags that are not r tags", () => {
    const event = eventWithTags([
      ["p", "abc"],
      ["r", "wss://nos.lol"],
      ["t", "nostr"],
    ]);
    expect(getRelayURLs(event)).toEqual(["wss://nos.lol/"]);
  });

  it("drops non-relay schemes", () => {
    const event = eventWithTags([
      ["r", "http://evil.example"],
      ["r", "wss://nos.lol"],
    ]);
    expect(getRelayURLs(event)).toEqual(["wss://nos.lol/"]);
  });

  /**
   * The reason the `isSafeRelayURL` filter cannot be dropped: `normalizeURL`
   * throws on input it cannot parse, and a kind-10002 is relay data, so it can
   * contain anything. Without the filter this is an exception thrown out of a
   * clientLoader rather than a relay list.
   */
  it("survives junk in an r tag instead of throwing", () => {
    const event = eventWithTags([
      ["r", "not a url"],
      ["r", "javascript:alert(1)"],
      ["r", ""],
      ["r"],
      ["r", "wss://nos.lol"],
    ]);
    expect(() => getRelayURLs(event)).not.toThrow();
    expect(getRelayURLs(event)).toEqual(["wss://nos.lol/"]);
  });

  it("returns an empty list when there are no r tags", () => {
    expect(getRelayURLs(eventWithTags([]))).toEqual([]);
  });
});
