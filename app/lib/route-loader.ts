import { default as clientStore } from "~/services/data";
import { default as serverStore } from "~/services/data.server";
import type { DataStore } from "~/services/types";

/**
 * Re-export stores for routes to use with the standard loader pattern.
 *
 * React Router requires separate named exports for `loader` and `clientLoader`,
 * so we can't use destructuring. Instead, use this pattern in routes:
 *
 * @example
 * ```typescript
 * import { clientStore, serverStore, type DataStore } from "~/lib/route-loader";
 *
 * async function loadData(store: DataStore, { params }: Route.MetaArgs) {
 *   const event = await store.fetchEvent({ id: params.id });
 *   return { event };
 * }
 *
 * export async function loader(args: Route.MetaArgs) {
 *   return loadData(serverStore, args);
 * }
 *
 * export async function clientLoader(args: Route.MetaArgs) {
 *   return loadData(clientStore, args);
 * }
 * ```
 */
export { clientStore, serverStore };
export type { DataStore };
