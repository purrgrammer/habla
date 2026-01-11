import type { Route } from "./+types/event";
import { kinds, nip19, type NostrEvent } from "nostr-tools";
import Highlight from "~/ui/nostr/highlight";
import Note from "~/ui/nostr/note";
import NostrCard from "~/ui/nostr/card";
import defaults, { eventMeta } from "~/seo";
import { default as clientStore } from "~/services/data";
import { default as serverStore } from "~/services/data.server";
import { type DataStore } from "~/services/types";
import type { ProfileContent } from "applesauce-core/helpers";
import type { ReactNode } from "react";
import { EventReply } from "~/ui/nostr/reply";
import { Conversation } from "~/ui/nostr/article-conversation";
import ClientOnly from "~/ui/client-only";

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return defaults;
  return eventMeta(loaderData.event, loaderData.profile);
}

async function loadData(store: DataStore, { params }: Route.MetaArgs) {
  const { nevent } = params;
  const decoded = nip19.decode(nevent);
  if (decoded?.type === "nevent" && decoded?.data.author) {
    const [profile, event] = await Promise.all([
      store.fetchProfile({ pubkey: decoded.data.author }),
      store.fetchEvent(decoded.data),
    ]);
    if (event) {
      return { event, profile };
    }
  } else if (decoded?.type === "note") {
    const event = await store.fetchEvent({ id: decoded.data });
    if (event) {
      const profile = await store.fetchProfile({ pubkey: event.pubkey });
      return { profile, event };
    }
  }
}

export async function loader(args: Route.MetaArgs) {
  return loadData(serverStore, args);
}

export async function clientLoader(args: Route.MetaArgs) {
  return loadData(clientStore, args);
}

interface ComponentProps {
  profile?: ProfileContent;
  event: NostrEvent;
}

type Component = (props: ComponentProps) => ReactNode;

const components: Record<number, Component> = {
  [kinds.ShortTextNote]: Note,
  [kinds.Highlights]: (props) => <Highlight {...props} noHeader />,
};

export default function Event({ loaderData, params }: Route.ComponentProps) {
  const { profile, event } = loaderData ?? {};

  if (!event) {
    // TODO: 404
    return null;
  }

  const Component = components[event.kind];
  return Component ? (
    <div className="flex flex-col gap-10 w-full">
      <NostrCard
        className="border-none"
        noFooter
        profile={profile}
        event={event}
      >
        <Component profile={profile} event={event} />
      </NostrCard>
      <ClientOnly>{() => <Conversation event={event} />}</ClientOnly>
    </div>
  ) : (
    <>
      <EventReply event={event} />
      <ClientOnly>{() => <Conversation event={event} />}</ClientOnly>
    </>
  );
}
