import { getMembers } from "~/services/data.server";

export async function loader() {
  const users = await getMembers();
  return Response.json(users);
}
