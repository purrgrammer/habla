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

// Setup global subscription/publish methods for all signer classes
const sub = (relays: string[], filters: any[]) => pool.req(relays, filters);
const pub = (relays: string[], event: any) => pool.publish(relays, event);

for (const key in Signers) {
  const S = (Signers as any)[key];
  if (S && typeof S === "function") {
    S.subscriptionMethod = sub;
    S.publishMethod = pub;
  }
}

// Also set on account classes
(ExtensionAccount as any).subscriptionMethod = sub;
(ExtensionAccount as any).publishMethod = pub;
(NostrConnectAccount as any).subscriptionMethod = sub;
(NostrConnectAccount as any).publishMethod = pub;

// Setup account manager
const accountManager = new AccountManager();
accountManager.registerType(ExtensionAccount);
accountManager.registerType(NostrConnectAccount);

// Load persisted accounts
if (typeof window !== "undefined") {
  const stored = localStorage.getItem(ACCOUNTS);
  if (stored) {
    const json = safeParse(stored);
    if (json) {
      // Ensure methods are set before deserializing
      NostrConnectSigner.subscriptionMethod = sub;
      NostrConnectSigner.publishMethod = pub;
      (NostrConnectAccount as any).subscriptionMethod = sub;
      (NostrConnectAccount as any).publishMethod = pub;

      try {
        accountManager.fromJSON(json);
      } catch (e) {
        console.error("Failed to load accounts:", e);
      }
    }
  }
}

// Save accounts to localStorage when they change
accountManager.accounts$.subscribe(() => {
  if (typeof window !== "undefined") {
    localStorage.setItem(ACCOUNTS, JSON.stringify(accountManager.toJSON()));
  }
});

// Load active account
if (typeof window !== "undefined") {
  const activeAccountId = localStorage.getItem(ACTIVE_ACCOUNT);
  if (activeAccountId) {
    if (accountManager.getAccount(activeAccountId)) {
      accountManager.setActive(activeAccountId);
    } else {
      localStorage.removeItem(ACTIVE_ACCOUNT);
    }
  }
}

// Save active account to localStorage
accountManager.active$.subscribe((account) => {
  if (typeof window !== "undefined") {
    if (account) localStorage.setItem(ACTIVE_ACCOUNT, account.id);
    else localStorage.removeItem(ACTIVE_ACCOUNT);
  }
});

export default accountManager;
