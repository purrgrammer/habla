import { ActionRunner } from "applesauce-actions";

import accounts from "./accounts";
import eventStore from "./event-store";

/**
 * Runs actions (publish article, comment, zap request) against the event store.
 *
 * No publish method is wired in on purpose: every caller uses `runner.exec()`,
 * which hands back the signed events so the UI can publish them itself and
 * report per-relay progress.
 */
const runner = new ActionRunner(eventStore, accounts.signer);

export default runner;
