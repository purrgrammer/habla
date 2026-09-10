import { describe, it, expect } from "vitest";
import { kinds, type NostrEvent } from "nostr-tools";
import { addressOrId, displayPubkey } from "./event";

const AUTHOR = "a".repeat(64);
const WALLET = "b".repeat(64);
const SENDER = "c".repeat(64);
const ID = "d".repeat(64);

function event(over: Partial<NostrEvent> = {}): NostrEvent {
  return {
    id: ID,
    pubkey: AUTHOR,
    created_at: 0,
    kind: kinds.ShortTextNote,
    tags: [],
    content: "",
    sig: "0".repeat(128),
    ...over,
  };
}

describe("addressOrId", () => {
  it("gives a replaceable event its kind:pubkey:d address", () => {
    const article = event({
      kind: kinds.LongFormArticle,
      tags: [["d", "my-slug"]],
    });
    expect(addressOrId(article)).toBe(
      `${kinds.LongFormArticle}:${AUTHOR}:my-slug`,
    );
  });

  it("gives a non-replaceable event its id", () => {
    expect(addressOrId(event({ kind: kinds.ShortTextNote }))).toBe(ID);
  });

  /**
   * The case the function exists for. applesauce v6 returns null rather than
   * throwing for a non-replaceable event, and an earlier shape of this code
   * let that null reach callers as a tag value.
   */
  it("never returns null or undefined", () => {
    for (const kind of [0, 1, 3, 1111, 9735, 30023, 30040]) {
      const value = addressOrId(event({ kind, tags: [["d", "x"]] }));
      expect(typeof value).toBe("string");
      expect(value.length).toBeGreaterThan(0);
    }
  });

  it("treats a replaceable event with no d tag as addressable with an empty d", () => {
    const profile = event({ kind: kinds.Metadata });
    expect(addressOrId(profile)).toBe(`${kinds.Metadata}:${AUTHOR}:`);
  });
});

describe("displayPubkey", () => {
  it("returns the author for an ordinary event", () => {
    expect(displayPubkey(event())).toBe(AUTHOR);
  });

  it("credits the zap sender, not the wallet that published the receipt", () => {
    const receipt = event({
      kind: kinds.Zap,
      pubkey: WALLET,
      tags: [["P", SENDER]],
    });
    expect(displayPubkey(receipt)).toBe(SENDER);
  });

  it("falls back to the publishing pubkey when a receipt names no sender", () => {
    const receipt = event({ kind: kinds.Zap, pubkey: WALLET, tags: [] });
    expect(displayPubkey(receipt)).toBe(WALLET);
  });

  it("does not look for a sender on a non-zap event", () => {
    const note = event({ tags: [["P", SENDER]] });
    expect(displayPubkey(note)).toBe(AUTHOR);
  });
});
