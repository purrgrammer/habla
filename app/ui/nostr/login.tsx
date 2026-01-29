"use client";

import { nip19, kinds } from "nostr-tools";
import { merge } from "rxjs";
import {
  Wallet,
  PlugZap,
  Check,
  Coins,
  Bitcoin,
  Euro,
  DollarSign,
  LogOut,
  Palette,
  Sun,
  Moon,
  SunMoon,
  User as UserIcon,
  Feather,
  HandHeart,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useActiveAccount, useAccountManager } from "applesauce-react/hooks";
import { ExtensionAccount } from "applesauce-accounts/accounts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/ui/dialog";
import { useProfile } from "~/hooks/nostr";
import { profileLoader } from "~/services/loaders";
import User from "~/ui/nostr/user";
import { Button } from "~/ui/button";
import { useTheme } from "~/ui/theme-provider";
import { useCurrency } from "~/services/currency";
import { useWallet, useWalletInfo } from "~/services/wallet";
import { ConnectWallet } from "./nwc";
import ZapDialog from "./zap";
import { HABLA_PUBKEY } from "~/const";
import { useState, useCallback } from "react";
import { WalletName } from "../wallet";
import { Badge } from "../badge";
import RemoteSignerLogin from "./remote-signer";

function LoggedInUser({ pubkey }: { pubkey: string }) {
  const account = useActiveAccount();
  const { wallet } = useWallet();
  const accountManager = useAccountManager();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { currency, setCurrency } = useCurrency();

  const profile = useProfile(pubkey);
  const nprofile = nip19.npubEncode(pubkey);
  const name = profile?.name || pubkey.slice(0, 8);
  const image = profile?.picture || "/favicon.ico";

  function goToWallet() {
    navigate("/wallet");
  }

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
    <>
      <div className="flex flex-row items-center gap-2 sm:gap-4">
        <div className="flex flex-row items-center gap-1">
          {wallet ? (
            <DonateButton />
          ) : (
            <ConnectWallet>
              <Button variant="ghost" size="icon">
                <PlugZap />
              </Button>
            </ConnectWallet>
          )}
          <Button
            aria-label="Write"
            variant="default"
            size="sm"
            onClick={write}
          >
            <Feather className="dark:text-foreground" />
            <span className="hidden sm:inline dark:text-foreground">Write</span>
          </Button>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="link" size="icon">
              <User onlyAvatar img="size-7" pubkey={pubkey} profile={profile} />
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
              <DropdownMenuSeparator />
              {wallet ? (
                <DropdownMenuItem onClick={goToWallet}>
                  <WalletName />
                </DropdownMenuItem>
              ) : null}
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
                <DropdownMenuItem onClick={() => setCurrency()}>
                  <div className="flex flex-row items-center gap-2 w-full">
                    <Bitcoin className="size-4 text-muted-foreground" />
                    Bitcoin
                    {currency ? null : <Check className="ml-auto" />}
                  </div>
                </DropdownMenuItem>
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
    </>
  );
}

function DonateButton() {
  const [isDonating, setIsDonating] = useState(false);
  return (
    <ZapDialog
      open={isDonating}
      onOpenChange={setIsDonating}
      pubkey={HABLA_PUBKEY}
      trigger={
        <Button size="sm" variant="secondary">
          <HandHeart />
          <span className="hidden sm:inline dark:text-foreground">Donate</span>
        </Button>
      }
    />
  );
}

export default function Login() {
  const account = useActiveAccount();
  const accountManager = useAccountManager();
  const [open, setOpen] = useState(false);

  const handleConnected = useCallback(() => setOpen(false), []);

  async function getStarted() {
    try {
      const account = await ExtensionAccount.fromExtension();
      const pubkey = await account.getPublicKey();
      // Load user profile and relay list
      const loadUser = merge(
        profileLoader({ kind: kinds.Metadata, pubkey }),
        profileLoader({ kind: kinds.RelayList, pubkey }),
        profileLoader({ kind: 10063, pubkey }),
      );
      const sub = loadUser.subscribe();
      // Add account & set as active
      accountManager.addAccount(account);
      accountManager.setActive(account);
      // Clean up subscription
      sub.unsubscribe();
      setOpen(false);
    } catch (e) {
      console.error(e);
    }
  }
  return (
    <div className="flex flex-row items-center gap-1">
      {account ? (
        <LoggedInUser pubkey={account.pubkey} />
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button type="button">Get started</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Login to Habla</DialogTitle>
              <DialogDescription>Choose a method to sign in.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Button
                onClick={getStarted}
                variant="outline"
                className="w-full justify-start gap-2"
              >
                <img src="/favicon.ico" className="w-4 h-4" alt="" />
                Browser Extension (NIP-07)
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or connect remotely
                  </span>
                </div>
              </div>
              <RemoteSignerLogin onConnected={handleConnected} />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
