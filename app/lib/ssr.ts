import { isRouteErrorResponse } from "react-router";

/**
 * Hard deadline for anything a server loader does before responding.
 *
 * Nostr relays and Redis are both third parties we do not control, so no SSR
 * request is allowed to wait on them indefinitely. When the deadline passes we
 * return `null` loader data, the route renders its skeleton, and the matching
 * `clientLoader` fetches the real data in the browser.
 */
export const SSR_TIMEOUT = envNumber("SSR_TIMEOUT", 3_000);

/** Deadline for the slower, list-shaped loaders (timelines, sitemaps). */
export const SSR_LIST_TIMEOUT = envNumber("SSR_LIST_TIMEOUT", 4_000);

/** Read a numeric env var without assuming `process` exists (this module is isomorphic). */
function envNumber(name: string, fallback: number): number {
  const raw = typeof process !== "undefined" ? process.env?.[name] : undefined;
  const parsed = raw === undefined ? NaN : Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const TIMED_OUT = Symbol("ssr-timeout");

/**
 * Resolve `promise`, or `TIMED_OUT` once `ms` have passed. The underlying
 * promise is left running (its result may still land in a cache), it just
 * stops holding up the response.
 */
function race<T>(
  promise: Promise<T>,
  ms: number,
): Promise<T | typeof TIMED_OUT> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve(TIMED_OUT), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/**
 * Is this a thrown routing signal (404, redirect, ...) rather than a failure?
 * Those must reach React Router untouched — swallowing a `notFound()` would
 * turn a real 404 into a page that renders forever.
 */
function isRoutingSignal(error: unknown): boolean {
  return (
    error instanceof Response ||
    isRouteErrorResponse(error) ||
    (typeof error === "object" &&
      error !== null &&
      "status" in error &&
      "data" in error)
  );
}

/**
 * Run a server loader under a hard deadline.
 *
 * Returns `null` if it times out or fails, which every route treats as
 * "render the skeleton, let the client fetch it". Routing signals such as
 * `notFound()` are rethrown so real 404s stay 404s.
 */
export async function ssrDeadline<T>(
  label: string,
  work: () => Promise<T>,
  ms: number = SSR_TIMEOUT,
): Promise<T | null> {
  const start = Date.now();
  try {
    const result = await race(work(), ms);
    if (result === TIMED_OUT) {
      console.warn(`[ssr] ${label} exceeded ${ms}ms, falling back to client`);
      return null;
    }
    return result;
  } catch (error) {
    if (isRoutingSignal(error)) throw error;
    console.warn(
      `[ssr] ${label} failed after ${Date.now() - start}ms, falling back to client:`,
      error,
    );
    return null;
  }
}

/**
 * Same deadline, but for loaders that must always produce a value (API routes,
 * sitemaps). Falls back to `fallback` instead of `null`.
 */
export async function ssrDeadlineOr<T>(
  label: string,
  work: () => Promise<T>,
  fallback: T,
  ms: number = SSR_TIMEOUT,
): Promise<T> {
  const result = await ssrDeadline(label, work, ms);
  return result === null ? fallback : result;
}
