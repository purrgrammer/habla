import { useState, useEffect } from "react";
import type { Editor } from "@tiptap/react";
import { getMarkRange } from "@tiptap/core";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/ui/dialog";
import { Button } from "~/ui/button";
import { Input } from "~/ui/input";
import { Label } from "~/ui/label";

interface LinkDialogProps {
  editor: Editor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialHref?: string;
  initialText?: string;
  initialFrom?: number;
  initialTo?: number;
}

export default function LinkDialog({
  editor,
  open,
  onOpenChange,
  initialHref,
  initialText,
  initialFrom,
  initialTo,
}: LinkDialogProps) {
  const [href, setHref] = useState("");
  const [text, setText] = useState("");
  const [linkRange, setLinkRange] = useState<{
    from: number;
    to: number;
  } | null>(null);

  useEffect(() => {
    if (!open) return;

    // Use initial values if provided (from clicking a link)
    if (initialHref !== undefined || initialText !== undefined) {
      console.log(
        "LinkDialog received initial values - href:",
        initialHref,
        "text:",
        initialText,
        "range:",
        initialFrom,
        "-",
        initialTo,
      );
      setHref(initialHref || "");
      setText(initialText || "");
      // Store the range for later use
      if (initialFrom !== undefined && initialTo !== undefined) {
        setLinkRange({ from: initialFrom, to: initialTo });
      }
      return;
    }

    // Otherwise read from editor (from toolbar button)
    if (!editor) return;

    setLinkRange(null); // Clear range for new links

    if (editor.isActive("link")) {
      // Editing existing link
      const linkAttrs = editor.getAttributes("link");
      const { from, to } = editor.state.selection;
      const selectedText = editor.state.doc.textBetween(from, to);
      setHref(linkAttrs.href || "");
      setText(selectedText || "");
    } else {
      // Creating new link
      const { from, to } = editor.state.selection;
      const selectedText = editor.state.doc.textBetween(from, to);
      setHref("");
      setText(selectedText || "");
    }
  }, [editor, open, initialHref, initialText, initialFrom, initialTo]);

  function handleSave() {
    if (!editor || !href.trim()) return;

    // If we have a stored range (from clicking a link), use it
    if (linkRange) {
      const { from, to } = linkRange;
      const currentText = editor.state.doc.textBetween(from, to);

      console.log("Updating link with range:", {
        from,
        to,
        currentText,
        newText: text,
        href,
      });

      if (text.trim() && text !== currentText) {
        // Text was changed - replace the entire link at the stored range
        editor
          .chain()
          .focus()
          .deleteRange({ from, to })
          .insertContentAt(from, {
            type: "text",
            text: text,
            marks: [{ type: "link", attrs: { href } }],
          })
          .run();
      } else {
        // Only URL changed - update the link mark at the stored range
        editor
          .chain()
          .focus()
          .setTextSelection({ from, to })
          .setLink({ href })
          .run();
      }
    } else {
      // No stored range - use current selection (new link or toolbar edit)
      const isEditing = editor.isActive("link");

      if (isEditing) {
        // Editing existing link via toolbar
        const { from, to } = editor.state.selection;
        const selectedText = editor.state.doc.textBetween(from, to);

        if (text.trim() && text !== selectedText) {
          // Text was changed - replace the entire link
          editor
            .chain()
            .focus()
            .deleteSelection()
            .insertContent({
              type: "text",
              text: text,
              marks: [{ type: "link", attrs: { href } }],
            })
            .run();
        } else {
          // Only URL changed - just update the link mark
          editor.chain().focus().setLink({ href }).run();
        }
      } else {
        // Creating new link
        if (text.trim()) {
          // Insert text with link
          editor
            .chain()
            .focus()
            .insertContent({
              type: "text",
              text: text,
              marks: [{ type: "link", attrs: { href } }],
            })
            .run();
        } else {
          // Just set link on current selection
          editor.chain().focus().setLink({ href }).run();
        }
      }
    }

    handleClose();
  }

  function handleRemove() {
    if (!editor) return;
    editor.chain().focus().unsetLink().run();
    handleClose();
  }

  function handleClose() {
    setHref("");
    setText("");
    setLinkRange(null);
    onOpenChange(false);
  }

  const isEditing = editor?.isActive("link");

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Link" : "Insert Link"}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="link-url">URL</Label>
            <Input
              id="link-url"
              placeholder="https://example.com"
              value={href}
              onChange={(e) => setHref(e.target.value)}
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="link-text">Link Text (optional)</Label>
            <Input
              id="link-text"
              placeholder="Link text"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          {isEditing && (
            <Button variant="destructive" onClick={handleRemove}>
              Remove Link
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!href.trim()}>
              {isEditing ? "Update" : "Insert"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
