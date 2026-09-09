import { QueryClientProvider } from "@tanstack/react-query";
import {
  EventStoreProvider,
  AccountsProvider,
  ActionsProvider,
} from "applesauce-react";
import { ThemeProvider } from "~/ui/theme-provider";
import { WalletProvider } from "~/services/wallet";
import queryClient from "~/services/query";
import eventStore from "~/services/event-store";
import accountManager from "~/services/accounts";
import actionRunner from "~/services/action-hub";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <EventStoreProvider eventStore={eventStore}>
        <AccountsProvider manager={accountManager}>
          <ActionsProvider runner={actionRunner}>
            <ThemeProvider defaultTheme="light" storageKey="habla-theme">
              <WalletProvider>{children}</WalletProvider>
            </ThemeProvider>
          </ActionsProvider>
        </AccountsProvider>
      </EventStoreProvider>
    </QueryClientProvider>
  );
}
