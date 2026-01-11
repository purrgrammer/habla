import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";
import { NostrConnectSigner } from "applesauce-signers";
import pool from "~/services/relay-pool";

// Setup global methods for NostrConnectSigner as early as possible
NostrConnectSigner.subscriptionMethod = (relays, filters) =>
  pool.req(relays, filters);
NostrConnectSigner.publishMethod = (relays, event) => pool.publish(relays, event);

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>,
  );
});