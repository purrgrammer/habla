import { useActionHub } from "applesauce-react/hooks";
import type { NostrEvent } from "nostr-tools";
import { Send } from "lucide-react";
import { useState } from "react";
import { firstValueFrom } from "rxjs";
import { Button } from "~/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "~/ui/dialog";
import { Textarea } from "~/ui/textarea";
import { Comment } from "~/nostr/actions";

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

  async function sendComment() {
    if (!comment) return;
    setIsCommenting(true);
    try {
      // TODO: send comment
      const ev = await firstValueFrom(
        hub.exec(Comment, {
          event,
          message: comment,
        }),
      );
      console.log(ev);
      return;
      setComment("");
      setShowCommentDialog(false);
    } catch (error) {
      console.error(error);
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
