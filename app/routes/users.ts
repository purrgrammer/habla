import { getUsers as getUsers } from "~/services/data.server";

export async function loader() {
  const response = await getUsers();
  return Response.json(response);
}
