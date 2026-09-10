import type { Config } from "@react-router/dev/config";

export default {
  /**
   * Habla is a single-page app. There is no server: the build is a folder of
   * static files (`build/client`) that can be served from anywhere — including
   * an nsite, where the whole app lives on Blossom servers and is addressed by
   * a nostr pubkey.
   *
   * Every route fetches its data from relays in the browser via `clientLoader`.
   */
  ssr: false,

  /**
   * The v8 flags, adopted on v7 first so the upgrade itself is inert.
   * Most are no-ops for a server-less SPA and are enabled to keep the config
   * honest rather than because they change anything here:
   *
   * - `v8_middleware` changes the loader `context` API. Nothing here takes a
   *   `context`; there is no server to run middleware on.
   * - `v8_splitRouteModules` chunks `clientLoader` and `HydrateFallback`
   *   separately. Pure build output, no code change.
   * - `v8_viteEnvironmentApi` moves custom SSR build config under
   *   `environments.ssr`. There is none — `ssr: false`.
   * - `v8_passThroughRequests` stops normalising the server `request`.
   *   Client loaders never see one.
   * - `v8_trailingSlashAwareDataRequests` renames `.data` requests, which a
   *   static build never issues.
   */
  future: {
    v8_middleware: true,
    v8_splitRouteModules: true,
    v8_viteEnvironmentApi: true,
    v8_passThroughRequests: true,
    v8_trailingSlashAwareDataRequests: true,
  },
} satisfies Config;
