import { Component, type ErrorInfo, type ReactNode } from "react";
import { TriangleAlert } from "lucide-react";
import { nip19 } from "nostr-tools";
import type { NostrEvent } from "nostr-tools";

/**
 * One bad event should cost one card, not the page.
 *
 * Everything rendered here arrives from a relay, which means it is written by
 * strangers and validated by nobody: a kind-30023 with no title, a highlight
 * whose source pointer does not decode, a note whose content parses into
 * something the renderer did not expect. Any of those can throw, and without a
 * boundary the throw unmounts the whole route — the reader loses the feed
 * because one author published something odd.
 *
 * React has no hook form of this. An error boundary has to be a class.
 */
export default class EventErrorBoundary extends Component<
  { event: NostrEvent; children: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Not a toast. This is not the reader's problem to act on, and a feed of
    // fifty events could raise fifty of them; the console is where the person
    // who can fix it will look.
    console.error(
      `[event] kind ${this.props.event.kind} ${this.props.event.id} failed to render`,
      error,
      info.componentStack,
    );
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const { event } = this.props;
    // A bech32 id the reader can paste elsewhere is more use than a hex string.
    let nevent: string | undefined;
    try {
      nevent = nip19.neventEncode({ id: event.id, author: event.pubkey });
    } catch {
      nevent = undefined;
    }

    return (
      <div className="flex flex-row items-start gap-2 rounded-sm border border-dashed p-3 text-muted-foreground">
        <TriangleAlert className="size-4 mt-0.5 shrink-0" />
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-sm">This event could not be displayed.</span>
          <span className="font-mono text-xs break-all">
            kind {event.kind} · {nevent ?? event.id}
          </span>
        </div>
      </div>
    );
  }
}
