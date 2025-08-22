import { type ReactNode } from "react";
import { type NostrEvent } from "nostr-tools";
import { Card, CardContent, CardHeader, CardFooter } from "~/ui/card";
import { getSeenRelays, type ProfileContent } from "applesauce-core/helpers";
import { Server } from "lucide-react";
import UserLink from "~/ui/nostr/user-link";
import Timestamp from "~/ui/timestamp";
import { cn } from "~/lib/utils";
import ClientOnly from "../client-only";
import { Button } from "../button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "~/ui/dropdown-menu";
import { RelayName, RelayIcon } from "./relay-link.client";
import { useNavigate } from "react-router";

function Relays({ relays }: { relays: Set<string> }) {
  const navigate = useNavigate();

  function goToRelay(relay: string) {
    const link = `/relay/${encodeURIComponent(relay)}`;
    navigate(link);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <div className="flex flex-row items-center gap-1 text-muted-foreground">
            <Server className="size-4" />
            <span className="font-mono text-sm">{relays?.size}</span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuLabel>Seen on</DropdownMenuLabel>
        {[...relays].map((r) => (
          <DropdownMenuItem key={r} onClick={() => goToRelay(r)}>
            <div className="flex flex-row items-center gap-1">
              <RelayIcon relay={r} className="size-5" />
              <RelayName relay={r} className="text-md" />
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function NostrCard({
  event,
  children,
  className,
  noFooter,
  profile,
}: {
  event: NostrEvent;
  children: ReactNode;
  className?: string;
  noFooter?: boolean;
  profile?: ProfileContent;
}) {
  const relays = getSeenRelays(event);
  return (
    <Card className={cn("gap-2 p-2 rounded-sm gap-1 w-full", className)}>
      <CardHeader className="py-1 px-2 flex flex-row items-center justify-between gap-2">
        <UserLink
          withNip05
          pubkey={event.pubkey}
          profile={profile}
          img="size-12 mr-2"
          name="font-sans text-xl"
        />
        <span className="hidden sm:block font-sans text-sm font-light text-muted-foreground">
          <Timestamp timestamp={event.created_at} />
        </span>
      </CardHeader>

      <CardContent className="font-sans text-md px-2">{children}</CardContent>
      {noFooter ? null : (
        <CardFooter className="px-2 pt-0 pb-1 flex justify-end">
          {relays ? (
            <ClientOnly
              fallback={
                <Button variant="ghost" size="icon">
                  <div className="flex flex-row items-center gap-1 text-muted-foreground">
                    <Server className="size-4" />
                    <span className="font-mono text-sm">{relays?.size}</span>
                  </div>
                </Button>
              }
            >
              {() => <Relays relays={relays} />}
            </ClientOnly>
          ) : null}
        </CardFooter>
      )}
    </Card>
  );
}
