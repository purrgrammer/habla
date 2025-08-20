"use client";

import { useState, useEffect } from "react";
import type { NostrEvent } from "nostr-tools";
import { map } from "rxjs";
import { type Filter, kinds } from "nostr-tools";
import { type EventPointer, type AddressPointer } from "nostr-tools/nip19";
import { useObservableMemo } from "applesauce-react/hooks";
import { safeParse, getTagValue, getSeenRelays } from "applesauce-core/helpers";
import { getRelayURLs } from "~/lib/url";
import {
  createTimelineLoader,
  createZapsLoader,
} from "applesauce-loaders/loaders";
import type { ProfileContent } from "applesauce-core/helpers/profile";
import pool from "~/services/relay-pool";
import { useEventStore } from "applesauce-react/hooks";
import {
  eventLoader,
  addressLoader,
  profileLoader,
} from "~/services/loaders.client";
import { getArticlePublished } from "applesauce-core/helpers";

export function useProfile(pubkey: string): ProfileContent | undefined {
  // TODO: refactor to use ProfileModel
  const eventStore = useEventStore();
  const profile = useObservableMemo(() => {
    return eventStore.profile(pubkey);
  }, [pubkey]);

  useEffect(() => {
    const subscription = profileLoader({
      kind: kinds.Metadata,
      pubkey,
    }).subscribe();

    return () => subscription.unsubscribe();
  }, [pubkey]);

  return profile;
}

export function useEvent(pointer: EventPointer) {
  const eventStore = useEventStore();
  const event = useObservableMemo(() => {
    return eventStore.event(pointer.id);
  }, [pointer]);

  useEffect(() => {
    const subscription = eventLoader(pointer).subscribe();
    return () => subscription.unsubscribe();
  }, [pointer]);

  return event;
}

export function useAddress(pointer: AddressPointer) {
  const eventStore = useEventStore();
  const event = useObservableMemo(() => {
    return eventStore.replaceable(
      pointer.kind,
      pointer.pubkey,
      pointer.identifier,
    );
  }, [pointer.kind, pointer.pubkey, pointer.identifier]);

  useEffect(() => {
    const subscription = addressLoader(pointer).subscribe();
    return () => subscription.unsubscribe();
  }, [pointer]);

  return event;
}

export function useRelays(pubkey: string): string[] {
  const eventStore = useEventStore();
  const relays = useObservableMemo(() => {
    return eventStore.replaceable(kinds.RelayList, pubkey).pipe(
      map((event) => {
        if (event) {
          const userRelays = getRelayURLs(event);
          return userRelays;
        }
        return [];
      }),
    );
  }, [pubkey]);

  useEffect(() => {
    const subscription = profileLoader({
      kind: kinds.RelayList,
      pubkey,
    }).subscribe();
    return () => subscription.unsubscribe();
  }, [pubkey]);

  return relays || [];
}

export function useTimeline(
  id: string,
  filters: Filter | Filter[],
  relays: string[],
  options: { limit?: number } = {
    limit: 20,
  },
) {
  const { limit } = options;
  const eventStore = useEventStore();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (relays.length === 0) return;

    const loader = createTimelineLoader(pool, relays, filters, {
      eventStore,
      limit,
    });
    setIsLoading(true);
    const subscription = loader().subscribe({
      complete: () => {
        setIsLoading(false);
      },
    });
    return () => subscription.unsubscribe();
  }, [id, relays.length]);

  const timeline = useObservableMemo(() => {
    return eventStore.timeline(filters).pipe(
      map((items) => {
        return items.filter((ev) => {
          const seenRelays = getSeenRelays(ev);
          return relays.some((r) => seenRelays?.has(r));
        });
      }),
      map((items) =>
        items.sort((a, b) => getArticlePublished(b) - getArticlePublished(a)),
      ),
    );
  }, [id]);

  const hasItems = timeline ? timeline.length > 0 : false;
  return { timeline, isLoading: hasItems ? false : isLoading };
}

export type Zap = NostrEvent & {
  amount: number;
};

function parseZap(event: NostrEvent): Zap | null {
  const description = getTagValue(event, "description");
  if (!description) return null;
  const json = safeParse(description);
  if (!json) return null;
  const amount = getTagValue(json, "amount");
  if (!amount || !Number(amount)) return null;
  return { ...json, amount: Number(amount) / 1000 } as Zap;
}

export function useZaps(event: NostrEvent) {
  const eventStore = useEventStore();
  const [zaps, setZaps] = useState<Zap[]>([]);

  useEffect(() => {
    const loader = createZapsLoader(pool, { eventStore });
    const subscription = loader(event).subscribe((zapEvent) => {
      const zap = parseZap(zapEvent);
      if (zap) {
        setZaps((prev) => [...prev, zap].sort((a, b) => b.amount - a.amount));
      }
    });
    return () => subscription.unsubscribe();
  }, [event.id]);

  return zaps;
}
