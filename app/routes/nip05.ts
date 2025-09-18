import { getNip05 } from "~/services/data.server";

export async function loader() {
  //const { username } = request.query;
  const response = await getNip05();
  return Response.json(response, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
