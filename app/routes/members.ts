import { getFeaturedUsers } from "~/featured";

export async function loader() {
  const users = await getFeaturedUsers();
  return Response.json(users);
}
