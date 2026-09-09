import { getMembers } from "~/services/data.server";
import { ssrDeadlineOr } from "~/lib/ssr";
import type { Nip05Pointer } from "~/services/types";

export async function loader() {
  const users = await ssrDeadlineOr(
    "api/members",
    getMembers,
    [] as Nip05Pointer[],
  );
  return Response.json(users);
}
