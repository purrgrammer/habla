import { describe, it, expect } from "vitest";
import { EMPTY, NEVER, of, throwError, timer, concat } from "rxjs";
import { map } from "rxjs/operators";
import { firstOrNothing } from "./first-or-nothing";

// Short enough that the suite stays fast, long enough not to race the
// microtask queue on a loaded machine.
const MS = 50;

describe("firstOrNothing", () => {
  it("resolves the first value", async () => {
    await expect(firstOrNothing(of("a", "b", "c"), MS)).resolves.toBe("a");
  });

  it("takes the first value and ignores later ones", async () => {
    const source = concat(of(1), timer(MS * 4).pipe(map(() => 2)));
    await expect(firstOrNothing(source, MS)).resolves.toBe(1);
  });

  it("resolves undefined when the source completes empty", async () => {
    await expect(firstOrNothing(EMPTY, MS)).resolves.toBeUndefined();
  });

  // The two that matter: a route must reach its skeleton, not a rejected
  // promise or a pending one.
  it("resolves undefined instead of throwing when the source errors", async () => {
    const source = throwError(() => new Error("relay said no"));
    await expect(firstOrNothing(source, MS)).resolves.toBeUndefined();
  });

  it("resolves undefined instead of hanging when nothing arrives", async () => {
    const started = Date.now();
    await expect(firstOrNothing(NEVER, MS)).resolves.toBeUndefined();
    expect(Date.now() - started).toBeGreaterThanOrEqual(MS - 5);
  });

  it("returns a value that arrives before the deadline", async () => {
    const source = timer(MS / 5).pipe(map(() => "in time"));
    await expect(firstOrNothing(source, MS)).resolves.toBe("in time");
  });

  it("gives up on a value that arrives after the deadline", async () => {
    const source = timer(MS * 4).pipe(map(() => "too late"));
    await expect(firstOrNothing(source, MS)).resolves.toBeUndefined();
  });

  it("does not treat a falsy first value as absent", async () => {
    await expect(firstOrNothing(of(0), MS)).resolves.toBe(0);
    await expect(firstOrNothing(of(""), MS)).resolves.toBe("");
    await expect(firstOrNothing(of(null), MS)).resolves.toBeNull();
  });

  it("unsubscribes from the source once it has its value", async () => {
    let unsubscribed = false;
    const source = new (await import("rxjs")).Observable<string>((sub) => {
      sub.next("a");
      return () => {
        unsubscribed = true;
      };
    });
    await firstOrNothing(source, MS);
    expect(unsubscribed).toBe(true);
  });
});
