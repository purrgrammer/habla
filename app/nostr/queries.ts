import { useQuery } from "@tanstack/react-query";
import { queryProfile } from "nostr-tools/nip05";
import { fetchRelayInformation } from "nostr-tools/nip11";
import { getUsers } from "~/lib/api";

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: () => getUsers(),
    refetchOnMount: false,
    retryOnMount: true,
  });
}

export function useRelayInfo(relay: string) {
  return useQuery({
    queryKey: ["nip11", relay],
    queryFn: () => fetchRelayInformation(relay),
    refetchOnMount: false,
    retryOnMount: false,
  });
}

export function useNip05(nip05: string) {
  return useQuery({
    queryKey: ["nip05", nip05],
    queryFn: () => queryProfile(nip05),
    refetchOnMount: false,
    retryOnMount: false,
  });
}
