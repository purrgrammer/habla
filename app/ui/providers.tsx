import { QueryClientProvider } from "@tanstack/react-query";
import {
  EventStoreProvider,
  AccountsProvider,
  ActionsProvider,
  FactoryProvider,
} from "applesauce-react";
import { ThemeProvider } from "~/ui/theme-provider";
import { WalletProvider } from "~/services/wallet";
import queryClient from "~/services/query";
import eventStore from "~/services/event-store";
import factory from "~/services/event-factory";
import accountManager from "~/services/accounts";
import actionHub from "~/services/action-hub";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <EventStoreProvider eventStore={eventStore}>
        <AccountsProvider manager={accountManager}>
          <FactoryProvider factory={factory}>
            <ActionsProvider actionHub={actionHub}>
              <ThemeProvider defaultTheme="light" storageKey="habla-theme">
                <WalletProvider>
                  {children}
                </WalletProvider>
              </ThemeProvider>
            </ActionsProvider>
          </FactoryProvider>
        </AccountsProvider>
      </EventStoreProvider>
    </QueryClientProvider>
  );
}