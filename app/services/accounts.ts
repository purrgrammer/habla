import { safeParse } from "applesauce-core/helpers/json";
import { AccountManager } from "applesauce-accounts";
import { ExtensionAccount } from "applesauce-accounts/accounts";

const ACCOUNTS = "accounts";
const ACTIVE_ACCOUNT = "active-account";

// setup account manager
const accountManager = new AccountManager();
accountManager.registerType(ExtensionAccount);

// load all accounts
if (typeof window !== "undefined" && localStorage.getItem(ACCOUNTS)) {
  const accounts = localStorage.getItem(ACCOUNTS);
  if (accounts) {
    const json = safeParse(accounts);
    if (json) accountManager.fromJSON(json);
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
  accountManager.setActive(activeAccountId);
}

// save active to localStorage
accountManager.active$.subscribe((account) => {
  if (typeof window !== "undefined") {
    if (account) localStorage.setItem(ACTIVE_ACCOUNT, account.id);
    else localStorage.removeItem(ACTIVE_ACCOUNT);
  }
});

export default accountManager;
