import type { Route } from "./+types/markdown";

export async function loader({}: Route.MetaArgs) {
  const url = "TODO";
  if (!url) {
    return Response.error();
  }
  return Response.json({ url });
}
