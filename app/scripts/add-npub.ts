import WebSocket from "ws";
(global as any).WebSocket = WebSocket;

import { saveUser, fetchRelays, syncProfile } from "../services/data.server";
import { nip19 } from "nostr-tools";

async function addNpub({ npub, username }: { npub: string; username: string }) {
  const decoded = nip19.decode(npub);
  if (decoded.type === "npub") {
    await addUser({ username, pubkey: decoded.data });
    return;
  }
  if (decoded.type === "nprofile") {
    await addUser({ username, pubkey: decoded.data.pubkey });
    return;
  }

  console.error("Invalid npub/nprofile");
}

async function addUser({
  pubkey,
  username,
}: {
  pubkey: string;
  username: string;
}) {
  if (pubkey.length !== 64) {
    console.error(`Invalid pubkey ${pubkey}`);
    return;
  }
  if (username.length < 2) {
    console.error(`Invalid username ${username}`);
    return;
  }
  const relays = await fetchRelays(pubkey);
  const profile = await syncProfile(pubkey, relays);
  await saveUser({ pubkey, username, relays });
  console.log(`user ${username} added successfully!`);
  return profile;
}

await (async function main() {
  try {
    const args = process.argv.slice(2);

    if (args.length !== 2) {
      console.error("Usage: npm run add-npub <username> <npub>");
      console.error("Example: npm run add-npub alice npub1...");
      process.exit(1);
    }

    const [username, npub] = args;

    await addNpub({ username, npub });
  } catch (error) {
    console.error(`[users] failed to add: ${error}`);
  }
})()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
