import type { Route } from "./+types/event";
import { kinds, nip19 } from "nostr-tools";
import { firstValueFrom } from "rxjs";
import { eventLoader as clientEventLoader } from "~/services/loaders.client";
import { eventLoader as serverEventLoader } from "~/services/loaders.server";
import Highlight from "~/ui/nostr/highlight";
import defaults from "~/seo";

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return defaults;
  const event = loaderData;
  const title = "TODO";
  const description = "TODO";
  const image = "TODO";
  // TODO: author meta tags
  return [
    { title },
    { name: "og:title", content: title },
    { name: "og:type", content: "article" },
    ...(description
      ? [
          { name: "description", content: description },
          { name: "og:description", content: description },
        ]
      : []),
    ...(image ? [{ name: "og:image", content: image }] : []),
  ];
}

// TODO: fail on non long form articles
export async function loader({ params }: Route.MetaArgs) {
  const { nevent } = params;
  const decoded = nip19.decode(nevent);
  if (decoded?.type === "nevent") {
    // TODO: might not have relays metadata
    // TODO: might throw, 404 instead
    const event = firstValueFrom(serverEventLoader(decoded.data));
    return event;
  } else if (decoded?.type === "note") {
    const event = firstValueFrom(serverEventLoader({ id: decoded.data }));
    return event;
  }
}

export async function clientLoader({ params }: Route.MetaArgs) {
  const { nevent } = params;
  const decoded = nip19.decode(nevent);
  if (decoded?.type === "nevent") {
    // TODO: might throw, 404 instead
    const event = firstValueFrom(
      clientEventLoader({
        id: decoded.data.id,
        relays: decoded.data.relays,
      }),
    );
    return event;
  } else if (decoded?.type === "note") {
    const event = firstValueFrom(clientEventLoader({ id: decoded.data }));
    return event;
  }
}

export default function Event({ loaderData, params }: Route.ComponentProps) {
  // TODO: title, etc
  if (loaderData?.kind === kinds.Highlights) {
    return <Highlight event={loaderData} />;
  }
  return (
    <pre className="w-xl text-xs">{JSON.stringify(loaderData, null, 2)}</pre>
  );
}
