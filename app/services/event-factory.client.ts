import { EventFactory } from "applesauce-factory";
import accounts from "~/services/accounts.client";

const factory = new EventFactory({
  signer: accounts.signer,
});

export default factory;
