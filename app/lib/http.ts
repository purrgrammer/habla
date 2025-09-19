import { data } from "react-router";

export function notFound() {
  throw data("Not found", { status: 404 });
}
