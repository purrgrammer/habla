import { safeParse } from "applesauce-core/helpers/json";
import { AccountManager } from "applesauce-accounts";
import {
  ExtensionAccount,
  NostrConnectAccount,
} from "applesauce-accounts/accounts";
import * as Signers from "applesauce-signers";
import { NostrConnectSigner } from "applesauce-signers";
import pool from "./relay-pool";

const ACCOUNTS = "accounts";
const ACTIVE_ACCOUNT = "active-account";

// Setup global methods for NostrConnectSigner
const sub = (relays: string[], filters: any[]) => pool.req(relays, filters);
const pub = (relays: string[], event: any) => pool.publish(relays, event);

// Aggressively set on all signer classes
for (const key in Signers) {
  const S = (Signers as any)[key];
  if (S && typeof S === "function") {
    S.subscriptionMethod = sub;
    S.publishMethod = pub;
  }
}

// Also set on classes from accounts package
(ExtensionAccount as any).subscriptionMethod = sub;
(ExtensionAccount as any).publishMethod = pub;
(NostrConnectAccount as any).subscriptionMethod = sub;
(NostrConnectAccount as any).publishMethod = pub;

console.log(
  "[accounts] NostrConnectSigner.subscriptionMethod is set:",
  !!NostrConnectSigner.subscriptionMethod,
);

// setup account manager
const accountManager = new AccountManager();
accountManager.registerType(ExtensionAccount);
accountManager.registerType(NostrConnectAccount);

// load all accounts
if (typeof window !== "undefined" && localStorage.getItem(ACCOUNTS)) {
  const accounts = localStorage.getItem(ACCOUNTS);
  if (accounts) {
    const json = safeParse(accounts);
    if (json) {
      console.log("[accounts] Loading accounts from JSON...");
      console.log(
        "[accounts] NostrConnectSigner.subscriptionMethod before fromJSON:",
        !!NostrConnectSigner.subscriptionMethod,
      );
      // Redundant set right before fromJSON
      NostrConnectSigner.subscriptionMethod = sub;
      NostrConnectSigner.publishMethod = pub;
      (NostrConnectAccount as any).subscriptionMethod = sub;
      (NostrConnectAccount as any).publishMethod = pub;

      try {
        accountManager.fromJSON(json);
        console.log("[accounts] Accounts loaded successfully.");
      } catch (e) {
        console.error("[accounts] Failed to load accounts from JSON:", e);
      }
    }
  }
}

// save accounts to localStorage when they change
accountManager.accounts$.subscribe(() => {
  if (typeof window !== "undefined") {
    localStorage.setItem(ACCOUNTS, JSON.stringify(accountManager.toJSON()));
  }
});

// load active account
const activeAccountId =
  typeof window !== "undefined" ? localStorage.getItem(ACTIVE_ACCOUNT) : null;
// todo: make sure it's part of accounts
if (activeAccountId) {
  if (accountManager.getAccount(activeAccountId)) {
    accountManager.setActive(activeAccountId);
  } else {
    console.warn(`[accounts] Active account ${activeAccountId} not found in manager.`);
    if (typeof window !== "undefined") localStorage.removeItem(ACTIVE_ACCOUNT);
  }
}

// save active to localStorage
accountManager.active$.subscribe((account) => {
  if (typeof window !== "undefined") {
    if (account) localStorage.setItem(ACTIVE_ACCOUNT, account.id);
    else localStorage.removeItem(ACTIVE_ACCOUNT);
  }
});

export default accountManager;
