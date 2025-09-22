"use client";

import { useState, useEffect } from "react";
import type { NostrEvent } from "nostr-tools";
import { map, scan } from "rxjs";
import { type Filter, kinds } from "nostr-tools";
import { type EventPointer, type AddressPointer } from "nostr-tools/nip19";
import { useObservableMemo } from "applesauce-react/hooks";
import {
  getSeenRelays,
  getAddressPointerForEvent,
  getEventPointerForEvent,
  getZapPayment,
  getZapSender,
} from "applesauce-core/helpers";
import { EventZapsModel, ReceivedZapsModel } from "applesauce-core/models/zaps";
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
import { isReplaceableKind } from "nostr-tools/kinds";
import { AGGREGATOR_RELAYS } from "~/const";
import { ProfileModel } from "applesauce-core/models";
import type { Pubkey } from "~/types";

export function useProfile(pubkey: string): ProfileContent | undefined {
  const relays = useRelays(pubkey);
  const eventStore = useEventStore();
  const profile = useObservableMemo(() => {
    return eventStore.model(ProfileModel, pubkey);
  }, [pubkey]);

  useEffect(() => {
    const subscription = profileLoader({
      kind: kinds.Metadata,
      pubkey,
      relays,
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
  console.log("useTimeline", { id, filters, relays, options });

  useEffect(() => {
    if (relays.length === 0) return;
    const loader = createTimelineLoader(
      pool,
      relays.concat(AGGREGATOR_RELAYS),
      filters,
      {
        eventStore,
        limit,
      },
    );
    setIsLoading(true);
    const subscription = loader().subscribe({
      complete: () => {
        setIsLoading(false);
      },
    });
    return () => subscription.unsubscribe();
  }, [id, relays.length]);

  const timeline = useObservableMemo(() => {
    return eventStore.timeline(filters, false).pipe(
      //map((items) => {
      //  return items.filter((ev) => {
      //    const seenRelays = getSeenRelays(ev);
      //    return relays.some((r) => seenRelays?.has(r));
      //  });
      //}),
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

export function parseZap(event: NostrEvent): Zap | null {
  const amount = getZapPayment(event)?.amount;
  if (!amount) return null;
  return { ...event, amount: amount / 1000 };
}

export function usePubkeyZaps(pubkey: string) {
  const relays = useRelays(pubkey);
  const eventStore = useEventStore();
  const filters = {
    kinds: [kinds.Zap],
    "#p": [pubkey],
  };
  // todo: exhaust loader to load all

  useEffect(() => {
    const loader = createTimelineLoader(
      pool,
      relays.concat(AGGREGATOR_RELAYS),
      filters,
      { eventStore },
    );
    const subscription = loader().subscribe();
    return () => subscription.unsubscribe();
  }, [pubkey]);

  return useObservableMemo(() => {
    return eventStore.timeline(filters).pipe(
      map((items) => {
        const sorted = [...items];
        return (sorted.map(parseZap).filter(Boolean) as Zap[]).sort(
          (a, b) => b.amount - a.amount,
        );
      }),
      map((items) => {
        // todo: use scan?
        const senders = items.reduce(
          (acc, z) => {
            const sender = getZapSender(z);
            if (!sender) return acc;
            acc[sender] = (acc[sender] | 0) + z.amount;
            return acc;
          },
          {} as Record<string, number>,
        );
        const zappers = Object.entries(senders)
          .map((kv) => {
            const [k, v] = kv;
            return { pubkey: k, amount: v };
          })
          .sort((a, b) => b.amount - a.amount);
        return {
          zaps: items,
          total: items.reduce((acc, z) => acc + z.amount, 0),
          zappers,
        };
      }),
    );
  }, [pubkey]);
}

export function useZaps(event: NostrEvent) {
  const relays = useRelays(event.pubkey);
  const pointer = isReplaceableKind(event.kind)
    ? getAddressPointerForEvent(event)
    : getEventPointerForEvent(event);
  const eventStore = useEventStore();

  useEffect(() => {
    // Load existing zaps
    const loader = createZapsLoader(pool, {
      eventStore,
      extraRelays: AGGREGATOR_RELAYS.concat(relays),
      useSeenRelays: false,
    });
    const loaderSubscription = loader(event, relays).subscribe((zapEvent) => {
      eventStore.add(zapEvent);
    });

    // Subscribe to new zaps in real-time
    const zapFilters = isReplaceableKind(event.kind)
      ? {
          kinds: [kinds.Zap],
          "#a": [
            `${event.kind}:${event.pubkey}:${event.tags.find((t) => t[0] === "d")?.[1] || ""}`,
          ],
          since: Math.floor(Date.now() / 1000),
        }
      : {
          kinds: [kinds.Zap],
          "#e": [event.id],
          since: Math.floor(Date.now() / 1000),
        };

    const realtimeSubscription = pool
      .subscription(AGGREGATOR_RELAYS.concat(relays), zapFilters)
      .subscribe((zapEvent) => {
        if (zapEvent === "EOSE") return;
        eventStore.add(zapEvent);
      });

    return () => {
      loaderSubscription.unsubscribe();
      realtimeSubscription.unsubscribe();
    };
  }, [event.id]);

  return useObservableMemo(() => {
    return eventStore.model(EventZapsModel, pointer).pipe(
      map((items) => {
        const sorted = [...items];
        return (sorted.map(parseZap).filter(Boolean) as Zap[]).sort(
          (a, b) => b.amount - a.amount,
        );
      }),
      map((items) => {
        return {
          zaps: items,
          total: items.reduce((acc, z) => acc + z.amount, 0),
        };
      }),
    );
  }, [event.id]);
}

export function useProfileZaps(pubkey: Pubkey) {
  const relays = useRelays(pubkey);
  const eventStore = useEventStore();
  return useTimeline(
    `${pubkey}-zaps`,
    {
      kinds: [kinds.Zap],
      "#p": [pubkey],
    },
    relays,
  );
}
