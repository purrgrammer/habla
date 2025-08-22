import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { EventStoreProvider } from "applesauce-react/providers";
import {
  AccountsProvider,
  ActionsProvider,
  FactoryProvider,
} from "applesauce-react/providers";
import { ThemeProvider } from "~/ui/theme-provider.client";
import { WalletProvider } from "~/services/wallet.client";
import queryClient from "~/services/query";
import eventStore from "~/services/event-store";
import factory from "~/services/event-factory.client";
import accountManager from "~/services/accounts.client";
import actionHub from "~/services/action-hub.client";
import { Toaster } from "~/ui/sonner";

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <EventStoreProvider eventStore={eventStore}>
          <AccountsProvider manager={accountManager}>
            <FactoryProvider factory={factory}>
              <ActionsProvider actionHub={actionHub}>
                <ThemeProvider defaultTheme="light" storageKey="habla-theme">
                  <WalletProvider>
                    <HydratedRouter />
                    <Toaster />
                  </WalletProvider>
                </ThemeProvider>
              </ActionsProvider>
            </FactoryProvider>
          </AccountsProvider>
        </EventStoreProvider>
      </QueryClientProvider>
    </StrictMode>,
  );
});
