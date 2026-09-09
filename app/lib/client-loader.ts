/**
 * Wrap a `clientLoader` so it reuses the server's result on hydration and only
 * hits the relays itself when SSR came back empty.
 *
 * Why this exists: every SSR loader in this app runs under a hard deadline
 * (see `ssrDeadline`). When a relay is slow the server returns `null`, the
 * route renders its skeleton, and the browser has to finish the job. Marking
 * `clientLoader.hydrate = true` is what gets the client loader to run on that
 * first paint at all.
 *
 * On plain client-side navigations there is no server data worth waiting for,
 * so we skip `serverLoader()` entirely and go straight to the relays — asking
 * the server first would add a pointless round trip.
 */
export function hydrateFromServer<
  Args extends { serverLoader: () => Promise<unknown> },
  Data,
>(load: (args: Args) => Promise<Data>) {
  let hydrating = true;

  const clientLoader = async (args: Args): Promise<Data> => {
    if (hydrating) {
      hydrating = false;
      // During hydration this resolves from the embedded SSR payload, not the network.
      const server = (await args.serverLoader().catch(() => null)) as Data | null;
      if (server) return server;
    }
    return load(args);
  };

  clientLoader.hydrate = true as const;
  return clientLoader;
}
