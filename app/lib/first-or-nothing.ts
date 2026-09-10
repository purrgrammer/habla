import {
  catchError,
  defaultIfEmpty,
  firstValueFrom,
  of,
  timeout,
  type Observable,
} from "rxjs";

/**
 * The first value from a loader, or `undefined`. Never hangs, never throws.
 *
 * This is the promise every `clientLoader` is built on, and the reason a route
 * falls back to its skeleton instead of spinning: a relay that answers slowly,
 * answers with an error, or never answers at all all arrive here as the same
 * `undefined`.
 *
 * It lives in `lib/` rather than beside its caller so it can be tested without
 * pulling in the relay pool — the guarantee in that first sentence is the whole
 * point of the function, and it was previously asserted only by a comment.
 */
export function firstOrNothing<T>(
  source: Observable<T>,
  ms: number,
): Promise<T | undefined> {
  return firstValueFrom(
    source.pipe(
      timeout(ms),
      catchError(() => of(undefined)),
      defaultIfEmpty(undefined),
    ),
  );
}
