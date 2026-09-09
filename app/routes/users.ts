import { getUsers } from "~/services/data.server";
import { ssrDeadlineOr, SSR_LIST_TIMEOUT } from "~/lib/ssr";
import type { User } from "~/services/types";

export async function loader() {
  // Resolving every member's profile means talking to relays; an empty list is
  // a better answer than a hung request.
  const users = await ssrDeadlineOr(
    "api/users",
    getUsers,
    [] as User[],
    SSR_LIST_TIMEOUT,
  );
  return Response.json(users);
}
