import { getNip05 } from "~/services/data.server";
import { ssrDeadlineOr } from "~/lib/ssr";
import type { Nip05Data } from "~/services/types";

export async function loader() {
  const response = await ssrDeadlineOr("nostr.json", getNip05, {
    names: {},
    relays: {},
  } as Nip05Data);
  return Response.json(response, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
