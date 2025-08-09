"use client";

import { nip19, kinds } from "nostr-tools";
import { merge } from "rxjs";
import {
  Zap,
  Check,
  Coins,
  Euro,
  DollarSign,
  Bitcoin,
  LogOut,
  Palette,
  Sun,
  Moon,
  SunMoon,
  User as UserIcon,
  Feather,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useActiveAccount, useAccountManager } from "applesauce-react/hooks";
import { ExtensionSigner } from "applesauce-signers";
import { ExtensionAccount } from "applesauce-accounts/accounts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/ui/dropdown-menu";
import { useProfile, useRelays } from "~/hooks/nostr.client";
import { profileLoader } from "~/services/loaders.client";
import User from "~/ui/nostr/user";
import { Button } from "~/ui/button";
import { useTheme } from "~/ui/theme-provider.client";
import { useCurrency } from "~/services/currency.client";

function LoggedInUser({ pubkey }: { pubkey: string }) {
  const account = useActiveAccount();
  const accountManager = useAccountManager();
  const navigate = useNavigate();
  const relays = useRelays(pubkey);
  const { theme, setTheme } = useTheme();
  const { currency, setCurrency } = useCurrency();

  const profile = useProfile(pubkey);
  const nprofile = nip19.npubEncode(pubkey);
  const name = profile?.name || pubkey.slice(0, 8);
  const image = profile?.picture || "/favicon.ico";

  function logOut() {
    if (account) {
      accountManager.removeAccount(account);
    }
  }

  function goToProfile() {
    navigate(`/p/${nprofile}`);
  }

  function lightTheme() {
    setTheme("light");
  }

  function darkTheme() {
    setTheme("dark");
  }

  function systemTheme() {
    setTheme("system");
  }

  function write() {
    navigate("/write");
  }

  return (
    <div className="flex flex-row items-center gap-2 sm:gap-4">
      <Button
        aria-label="Write"
        disabled
        variant="default"
        size="sm"
        onClick={write}
      >
        <Feather className="dark:text-foreground" />
        <span className="hidden sm:inline dark:text-foreground">Write</span>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <User
              img="size-9"
              name="hidden"
              pubkey={pubkey}
              profile={profile}
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={goToProfile}>
            <div className="flex flex-row items-center gap-2">
              <UserIcon className="size-4 text-muted-foreground" />
              Profile
            </div>
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <div className="flex flex-row items-center gap-2">
                <Palette className="size-4 text-muted-foreground" />
                Theme
              </div>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={lightTheme}>
                <div className="flex flex-row items-center gap-2 w-full">
                  <Sun className="size-4 text-muted-foreground" />
                  Light
                  {theme === "light" ? <Check className="ml-auto" /> : null}
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={darkTheme}>
                <div className="flex flex-row items-center gap-2 w-full">
                  <Moon className="size-4 text-muted-foreground" />
                  Dark
                  {theme === "dark" ? <Check className="ml-auto " /> : null}
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={systemTheme}>
                <div className="flex flex-row items-center gap-2 w-full">
                  <SunMoon className="size-4 text-muted-foreground" />
                  System
                  {theme === "system" ? <Check className="ml-auto " /> : null}
                </div>
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <div className="flex flex-row items-center gap-2">
                <Coins className="size-4 text-muted-foreground" />
                Currency
              </div>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuLabel>Bitcoin</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setCurrency("BTC")}>
                <div className="flex flex-row items-center gap-2 w-full">
                  <Bitcoin className="size-4 text-muted-foreground" />
                  Bitcoin
                  {currency === "BTC" ? <Check className="ml-auto" /> : null}
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCurrency("sats")}>
                <div className="flex flex-row items-center gap-2 w-full">
                  <Zap className="size-4 text-muted-foreground" />
                  Sats
                  {currency === "sats" ? <Check className="ml-auto" /> : null}
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Fiat</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setCurrency("EUR")}>
                <div className="flex flex-row items-center gap-2 w-full">
                  <Euro className="size-4 text-muted-foreground" />
                  EUR
                  {currency === "EUR" ? <Check className="ml-auto " /> : null}
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCurrency("USD")}>
                <div className="flex flex-row items-center gap-2 w-full">
                  <DollarSign className="size-4 text-muted-foreground" />
                  USD
                  {currency === "USD" ? <Check className="ml-auto " /> : null}
                </div>
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logOut}>
            <div className="flex flex-row items-center gap-2">
              <LogOut className="size-4 text-destructive" />
              Log out
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default function Login() {
  const account = useActiveAccount();
  const accountManager = useAccountManager();

  async function getStarted() {
    // TODO: refactor to ExtensionAccount.fromExtension when released (v3)
    const signer = new ExtensionSigner();
    const pubkey = await signer.getPublicKey();
    const account = new ExtensionAccount(pubkey, signer);
    // Load user profile and relay list
    const loadUser = merge(
      profileLoader({ kind: kinds.Metadata, pubkey }),
      profileLoader({ kind: kinds.RelayList, pubkey }),
    );
    const sub = loadUser.subscribe();
    // Add account & set as active
    accountManager.addAccount(account);
    accountManager.setActive(account);
    // Clean up subscription
    sub.unsubscribe();
  }
  return account ? (
    <LoggedInUser pubkey={account.pubkey} />
  ) : (
    <Button type="button" onClick={getStarted}>
      Get started
    </Button>
  );
}
