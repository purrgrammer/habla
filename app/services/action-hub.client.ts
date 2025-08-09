import { ActionHub } from "applesauce-actions";
//import type { NostrEvent } from "nostr-tools";

//import pool from "./relay-pool";
import eventStore from "./event-store";
import eventFactory from "./event-factory.client";

//const publish = async (event: NostrEvent) => {
//  console.log("Publishing event:", event.kind);
//  await pool.publish(event, defaultRelays);
//};
const hub = new ActionHub(eventStore, eventFactory);

export default hub;
