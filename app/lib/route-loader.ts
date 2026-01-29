import { default as clientStore } from "~/services/data";
import { default as serverStore } from "~/services/data.server";
import type { DataStore } from "~/services/types";

/**
 * Creates a dual loader (server + client) from a single load function.
 *
 * This utility reduces boilerplate in routes by eliminating the need to
 * define both `loader` and `clientLoader` separately. Instead, you define
 * a single `loadData` function that takes a DataStore and route args.
 *
 * @example
 * ```typescript
 * // Before: ~15 lines of boilerplate per route
 * async function loadData(store: DataStore, { params }: Route.MetaArgs) {
 *   const event = await store.fetchEvent({ id: params.id });
 *   return { event };
 * }
 * export async function loader(args: Route.MetaArgs) {
 *   return loadData(serverStore, args);
 * }
 * export async function clientLoader(args: Route.MetaArgs) {
 *   return loadData(clientStore, args);
 * }
 *
 * // After: 3 lines
 * const { loader, clientLoader } = createDualLoader(async (store, { params }) => {
 *   const event = await store.fetchEvent({ id: params.id });
 *   return { event };
 * });
 * export { loader, clientLoader };
 * ```
 */
export function createDualLoader<TArgs, TReturn>(
  loadFn: (store: DataStore, args: TArgs) => Promise<TReturn>,
) {
  return {
    loader: (args: TArgs) => loadFn(serverStore, args),
    clientLoader: (args: TArgs) => loadFn(clientStore, args),
  };
}

/**
 * Re-export stores for cases where routes need direct access.
 */
export { clientStore, serverStore };
export type { DataStore };
