"use client";

import { type NostrEvent, nip19, kinds } from "nostr-tools";
import { merge } from "rxjs";
import {
  Feather,
  Eye,
  Menu,
  Check,
  Newspaper,
  LogOut,
  Palette,
  Sun,
  Moon,
  SunMoon,
  User as UserIcon,
  HardDriveUpload,
} from "lucide-react";
import Logo from "~/ui/logo";
import { useNavigate } from "react-router";
import { useActiveAccount, useAccountManager } from "applesauce-react/hooks";
import { ExtensionSigner } from "applesauce-signers";
import { ExtensionAccount } from "applesauce-accounts/accounts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/ui/dropdown-menu";
import { useProfile, useRelays, useTimeline } from "~/hooks/nostr.client";
import { profileLoader } from "~/services/loaders.client";
import { Button } from "~/ui/button";
import { useTheme } from "~/ui/theme-provider.client";
import { getArticleTitle } from "applesauce-core/helpers";

// TODO: drafts

function LoggedInUser({
  pubkey,
  canPublish,
  onPublish,
  onLoad,
  onSaveDraft,
  onNew,
}: {
  pubkey: string;
} & EditorMenuProps) {
  const account = useActiveAccount();
  const accountManager = useAccountManager();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const relays = useRelays(pubkey);
  const { timeline } = useTimeline(
    `${pubkey}-articles`,
    {
      kinds: [kinds.LongFormArticle],
      authors: [pubkey],
    },
    relays,
  );

  const profile = useProfile(pubkey);
  const nprofile = nip19.npubEncode(pubkey);

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

  return (
    <div className="flex flex-row items-center gap-1 sm:gap-4">
      {/*
      <Button
        disabled={!canPublish}
        aria-label="Save draft"
        variant="secondary"
        size="sm"
        //onClick={onSaveDraft}
      >
        <HardDriveUpload className="size-5" />
        <span className="hidden sm:inline">Save</span>
        </Button>
        */}
      <Button
        aria-label="Publish"
        variant="default"
        size="sm"
        onClick={onPublish}
        className="text-background dark:text-foreground"
      >
        <Logo className="size-5" />
        <span className="hidden sm:inline">Publish</span>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button aria-label="Menu" variant="ghost" size="sm">
            <Menu />
            Menu
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={onNew}>New Article</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Save</DropdownMenuLabel>
          <DropdownMenuItem disabled>
            <div
              className="flex flex-row items-center gap-2"
              onClick={onSaveDraft}
            >
              <HardDriveUpload className="size-4 text-muted-foreground" />
              Draft
            </div>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {timeline && timeline.length > 0 ? (
            <>
              <DropdownMenuSub>
                <DropdownMenuLabel>Load</DropdownMenuLabel>
                <DropdownMenuSubTrigger>
                  <div className="flex flex-row items-center gap-2">
                    <Newspaper className="size-4 text-muted-foreground" />
                    Articles
                  </div>
                </DropdownMenuSubTrigger>

                <DropdownMenuSubContent>
                  {timeline?.map((article) => {
                    return (
                      <DropdownMenuItem onClick={() => onLoad(article)}>
                        <div className="flex flex-row items-center justify-between gap-8 w-full">
                          {getArticleTitle(article)}
                        </div>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
            </>
          ) : null}
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

export interface EditorMenuProps {
  canPublish: boolean;
  onPublish: () => void;
  onLoad: (ev: NostrEvent) => void;
  onNew: () => void;
  onSaveDraft: () => void;
}

export default function EditorMenu(props: EditorMenuProps) {
  const account = useActiveAccount();
  const accountManager = useAccountManager();

  async function getStarted() {
    // TODO: refactor to ExtensionAccount.fromExtension when released (v3)
    const signer = new ExtensionSigner();
    const pubkey = await signer.getPublicKey();
    const account = new ExtensionAccount(pubkey, signer);
    // Load user profile, relay list and articles
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
    <LoggedInUser pubkey={account.pubkey} {...props} />
  ) : (
    <Button type="button" onClick={getStarted}>
      Get started
    </Button>
  );
}
