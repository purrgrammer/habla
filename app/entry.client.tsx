import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";
import { EventStoreProvider } from "applesauce-react/providers";
import { AccountsProvider, FactoryProvider } from "applesauce-react/providers";
import { ThemeProvider } from "~/ui/theme-provider.client";
import { QueryClientProvider } from "@tanstack/react-query";
import queryClient from "~/services/query";
import eventStore from "~/services/event-store";
import factory from "~/services/event-factory.client";
import accountManager from "~/services/accounts.client";

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <EventStoreProvider eventStore={eventStore}>
          <AccountsProvider manager={accountManager}>
            <FactoryProvider factory={factory}>
              <ThemeProvider defaultTheme="light" storageKey="habla-theme">
                <HydratedRouter />
              </ThemeProvider>
            </FactoryProvider>
          </AccountsProvider>
        </EventStoreProvider>
      </QueryClientProvider>
    </StrictMode>,
  );
});
