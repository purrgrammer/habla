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
} satisfies Config;
