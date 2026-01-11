import { Send } from "lucide-react";
import { useState } from "react";
import { firstValueFrom } from "rxjs";
import type { NostrEvent } from "nostr-tools";
import { kinds } from "nostr-tools";
import {
  useActionHub,
  useActiveAccount,
  useEventStore,
} from "applesauce-react/hooks";
import { useRelays } from "~/hooks/nostr";
import { getInboxes } from "applesauce-core/helpers";
import { Button } from "~/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "~/ui/dialog";
import { Textarea } from "~/ui/textarea";
import { Comment } from "~/nostr/actions";
import { publishToRelays } from "~/services/publish-article";
import { toast } from "sonner";

export default function CommentDialog({
  event,
  trigger,
  children,
  showCommentDialog,
  setShowCommentDialog,
}: {
  event: NostrEvent;
  trigger?: React.ReactNode;
  children?: React.ReactNode;
  showCommentDialog: boolean;
  setShowCommentDialog: (open: boolean) => void;
}) {
  const [comment, setComment] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const hub = useActionHub();
  const account = useActiveAccount();
  const eventStore = useEventStore();
  const userRelays = useRelays(account?.pubkey || "");

  async function sendComment() {
    if (!comment) return;

    setIsCommenting(true);
    try {
      // Sign the comment
      const signedComment = await firstValueFrom(
        hub.exec(Comment, {
          event,
          message: comment,
        }),
      );

      if (!signedComment) {
        throw new Error("Failed to sign comment");
      }

      // Get relays from both the OP and the user
      const opRelayList = eventStore.getReplaceable(
        kinds.RelayList,
        event.pubkey,
      );
      const opRelays = opRelayList ? getInboxes(opRelayList) : [];

      // Combine OP relays and user relays, removing duplicates
      const relays = Array.from(new Set([...opRelays, ...userRelays]));

      if (relays.length === 0) {
        throw new Error("No relays available to publish comment");
      }

      // Publish to relays
      const publishResult = await publishToRelays(
        signedComment,
        relays,
        (progress) => {
          progress.statuses.forEach((status) => {
            if (status.status === "error" && status.message) {
              toast.error(`Failed to publish to ${status.relay}`, {
                description: status.message,
              });
            }
          });
        },
      );

      if (publishResult.successCount === 0) {
        throw new Error("Failed to publish comment to any relay");
      }

      toast.success("Comment published!", {
        description: `Published to ${publishResult.successCount} of ${relays.length} relay${relays.length > 1 ? "s" : ""}`,
      });

      setComment("");
      setShowCommentDialog(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to publish comment", {
        description:
          error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setIsCommenting(false);
    }
  }

  return (
    <Dialog open={showCommentDialog} onOpenChange={setShowCommentDialog}>
      {trigger ? <DialogTrigger>{trigger}</DialogTrigger> : null}
      <DialogContent>
        <DialogTitle>Comment</DialogTitle>
        {children}
        <Textarea
          disabled={isCommenting}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <Button disabled={isCommenting} onClick={sendComment}>
          <Send />
          Send
        </Button>
      </DialogContent>
    </Dialog>
  );
}
