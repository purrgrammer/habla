import WebSocket from "ws";
(global as any).WebSocket = WebSocket;

import {
  default as store,
  saveUser,
  fetchRelays,
  syncRelays,
  syncProfile,
  syncArticles,
} from "./services/data.server";
import { type Nip05Pointer } from "~/services/types";
import { HABLA_PUBKEY } from "./const";

async function addUser({
  pubkey,
  username,
}: {
  pubkey: string;
  username: string;
}) {
  const relays = await fetchRelays(pubkey);
  const profile = await syncProfile(pubkey, relays);
  await saveUser({ pubkey, username, relays });
  console.log(`user ${username} added successfully!`);
  return profile;
}

async function syncUser(pointer: Nip05Pointer) {
  const { pubkey, nip05, relays } = pointer;
  console.log(`[sync] user ${nip05} started`);
  await Promise.allSettled([
    syncRelays(pubkey, nip05),
    syncProfile(pubkey, relays),
    syncArticles(pointer),
  ]);
  console.log(`[sync] user ${nip05} complete`);
}

async function syncUsers() {
  const users = await store.getMembers();
  console.log(`[sync] syncing ${users.length} members`);
  const responses = await Promise.allSettled(users.map(syncUser));
  const successes = responses.filter(({ status }) => status === "fulfilled");
  const errors = responses.filter(({ status }) => status === "rejected");
  console.log(
    `[sync] synced ${successes.length} members, ${errors.length} failed syncs`,
  );
}

const initialUsers = [
  {
    pubkey: HABLA_PUBKEY,
    username: "_",
  },
  {
    pubkey: "cd408a69cc6c737ca1a76efc3fa247c6ca53ec807f6e7c9574164164797e8162",
    username: "awayuki",
  },
  {
    username: "avichand",
    pubkey: "5002cb487a6e03a781d20b4d115bfc0e96abf7802d9ba4ee49d75a0231a0d6d8",
  },
  {
    username: "botev",
    pubkey: "2c930918de42dca5d140c84c58e6d4f25b05a5d016171001c29c2a236d90c511",
  },
  {
    username: "getalby",
    pubkey: "4657dfe8965be8980a93072bcfb5e59a65124406db0f819215ee78ba47934b3e",
  },
  {
    username: "verbiricha",
    pubkey: "7fa56f5d6962ab1e3cd424e758c3002b8665f7b0d8dcee9fe9e288d7751ac194",
  },
  {
    username: "tony",
    pubkey: "7f5c2b4e48a0e9feca63a46b13cdb82489f4020398d60a2070a968caa818d75d",
  },
  {
    username: "moon",
    pubkey: "5df413d4c5e5035ff508fd99b38b21ea9a0ac0b9ecc34f3312aba9aa2add4f5b",
  },
  {
    username: "dergigi",
    pubkey: "6e468422dfb74a5738702a8823b9b28168abab8655faacb6853cd0ee15deee93",
  },
  {
    username: "corndalorian",
    pubkey: "f8e6c64342f1e052480630e27e1016dce35fc3a614e60434fef4aa2503328ca9",
  },
  {
    username: "nostreport",
    pubkey: "2edbcea694d164629854a52583458fd6d965b161e3c48b57d3aff01940558884",
  },
  {
    username: "everexpanding",
    pubkey: "c9dccd5fbf13605415deb3ca03e9154cd77000f3fb1d98361e5cda4edce00d9a",
  },
  {
    username: "nout",
    pubkey: "deba271e547767bd6d8eec75eece5615db317a03b07f459134b03e7236005655",
  },
  {
    username: "sperry",
    pubkey: "11d0b66747887ba9a6d34b23eb31287374b45b1a1b161eac54cb183c53e00ef7",
  },
  {
    username: "sikto",
    pubkey: "50c59a1cb233d08d5a1fb493f520c6b5d7f77a2ba42e4666801a3e366b0a027e",
  },
  {
    username: "gigabtc",
    pubkey: "4d0068338af5ee79c06513deaaf02492247bbf7abd29f116e6e50c158ab6a677",
  },
  {
    username: "xanny",
    pubkey: "f0ff87e7796ba86fc84b4807b25a5dee206d724c6f61aa8853975a39deeeff58",
  },
  {
    username: "gzuuus",
    pubkey: "40b9c85fffeafc1cadf8c30a4e5c88660ff6e4971a0dc723d5ab674b5e61b451",
  },
  {
    username: "quentin",
    pubkey: "89e14be49ed0073da83b678279cd29ba5ad86cf000b6a3d1a4c3dc4aa4fdd02c",
  },
  {
    username: "jonb",
    pubkey: "35a8f9c0272c119a620f47c055c8db39e9f805fef1b22d0b7a42b189351dae66",
  },
  {
    username: "karnage",
    pubkey: "1bc70a0148b3f316da33fe3c89f23e3e71ac4ff998027ec712b905cd24f6a411",
  },
  {
    username: "herald",
    pubkey: "7e7224cfe0af5aaf9131af8f3e9d34ff615ff91ce2694640f1f1fee5d8febb7d",
  },
  {
    username: "devstr",
    pubkey: "700d3de34b2929478652de1a41738ea4b3589831a76d1adfc612bd6f2529fd22",
  },
  {
    username: "jb55",
    pubkey: "32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245",
  },
  {
    username: "ttdr",
    pubkey: "5ada3677187ff024a3cea797e89e1cc8b69f6099a40a6b8f644d3b027c21c9db",
  },
  {
    username: "blowater",
    pubkey: "6b9da920c4b6ecbf2c12018a7a2d143b4dfdf9878c3beac69e39bb597841cc6e",
  },
  {
    username: "freakoverse",
    pubkey: "3cea4806b1e1a9829d30d5cb8a78011d4271c6474eb31531ec91f28110fe3f40",
  },
  {
    username: "opensats",
    pubkey: "787338757fc25d65cd929394d5e7713cf43638e8d259e8dcf5c73b834eb851f2",
  },
  {
    username: "nvk",
    pubkey: "e88a691e98d9987c964521dff60025f60700378a4879180dcbbb4a5027850411",
  },
  {
    username: "fiatjaf",
    pubkey: "3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d",
  },
  {
    username: "lou",
    pubkey: "18e3af1edeecb70542eb7e000cf5c43ea0d6d3b79ebb64c8e2c98b341d42e5df",
  },
  {
    username: "newton",
    pubkey: "c31e22c3715c1bde5608b7e0d04904f22f5fc453ba1806d21c9f2382e1e58c6c",
  },
  {
    username: "guyswann",
    pubkey: "b9e76546ba06456ed301d9e52bc49fa48e70a6bf2282be7a1ae72947612023dc",
  },
  {
    username: "arfonzo",
    pubkey: "0ab50b198824f4ed986f4f497f6169f0d903122bcaa14bcb11cecd3b922522bc",
  },
  {
    username: "isolabellart",
    pubkey: "f4db5270bd991b17bea1e6d035f45dee392919c29474bbac10342d223c74e0d0",
  },
  {
    username: "jack",
    pubkey: "82341f882b6eabcd2ba7f1ef90aad961cf074af15b9ef44a09f9d2a8fbfbe6a2",
  },
  {
    username: "rabble",
    pubkey: "76c71aae3a491f1d9eec47cba17e229cda4113a0bbb6e6ae1776d7643e29cafa",
  },
  {
    username: "wastoids",
    pubkey: "36ceac901ac9983bd0224cfe9224d7e41b7527d0923847a9f5420d730d24128d",
  },
  {
    username: "franzap",
    pubkey: "726a1e261cc6474674e8285e3951b3bb139be9a773d1acf49dc868db861a1c11",
  },
  {
    username: "mavenleo",
    pubkey: "624d01ef570a3730afa1ebedc3ed95d57259ac5f37a9f0eac9c2a0d2f122bf4a",
  },
];

await (async function main() {
  //try {
  //  await addUser({
  //    username: "hodlbod",
  //    pubkey:
  //      "97c70a44366a6535c145b333f973ea86dfdc2d7a99da618c40c64705ad98e322",
  //  });
  //} catch (error) {
  //  console.error(`[users] failed to add: ${error}`);
  //}
  await syncUsers();
})()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
