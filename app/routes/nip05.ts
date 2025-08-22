import { getNip05 } from "~/services/data.server";

export async function loader() {
  //const { username } = request.query;
  const response = await getNip05();
  return Response.json(response);
}
