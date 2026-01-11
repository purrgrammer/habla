import { EventFactory } from "applesauce-factory";
import accounts from "~/services/accounts";

const factory = new EventFactory({
  signer: accounts.signer,
});

export default factory;
