import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/ui/dialog";
import { Button } from "~/ui/button";
import { Textarea } from "~/ui/textarea";

import {
  Loader2,
  Upload,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import { useActiveAccount } from "applesauce-react/hooks";
import { useRelays, useProfile } from "~/hooks/nostr";
import { extractTitle, generateIdentifier } from "~/nostr/publish-article";
import { toast } from "sonner";
import ImageUploadDialog from "~/ui/image-upload-dialog";
import store from "~/services/data";
import { nip19 } from "nostr-tools";
import { useNavigate } from "react-router";

interface PublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  markdown: string;
  onPublish: (params: {
    title: string;
    content: string;
    image?: string;
    summary?: string;
    relays: string[];
    alt?: string;
  }) => Promise<string | void>;
  existingImage?: string;
  existingSummary?: string;
  existingIdentifier?: string;
}

export default function PublishDialog({
  open,
  onOpenChange,
  markdown,
  onPublish,
  existingImage,
  existingSummary,
  existingIdentifier,
}: PublishDialogProps) {
  const account = useActiveAccount();
  const userRelays = useRelays(account?.pubkey || "");
  const profile = useProfile(account?.pubkey || "");
  const navigate = useNavigate();

  const [image, setImage] = useState<string>(existingImage || "");
  const [summary, setSummary] = useState<string>(existingSummary || "");
  const [selectedRelays, setSelectedRelays] = useState<string[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [imageUploadOpen, setImageUploadOpen] = useState(false);
  const [relaysExpanded, setRelaysExpanded] = useState(false);
  const [articleUrl, setArticleUrl] = useState<string>("");

  // Extract title from markdown
  const title = useMemo(() => extractTitle(markdown), [markdown]);

  // Use existing identifier if available, otherwise generate from title
  const identifier = useMemo(() => {
    return existingIdentifier || generateIdentifier(title);
  }, [existingIdentifier, title]);

  // Generate article URL preview
  useEffect(() => {
    if (!open || !account?.pubkey) {
      setArticleUrl("");
      return;
    }

    async function generateUrl() {
      const members = await store.getMembers();
      const member = members.find((m) => m.pubkey === account!.pubkey);

      if (member) {
        // Habla member: /:username/:identifier
        setArticleUrl(`/${member.nip05}/${identifier}`);
      } else {
        // Non-member: /u/:nip05 or /u/:npub
        const nip05 = profile?.nip05;
        const url = nip05
          ? `/u/${nip05}/${identifier}`
          : `/u/${nip19.npubEncode(account!.pubkey)}/${identifier}`;
        setArticleUrl(url);
      }
    }

    generateUrl();
  }, [open, account?.pubkey, profile?.nip05, identifier]);

  // Initialize selected relays (all write relays by default)
  useEffect(() => {
    if (open && userRelays.length > 0 && selectedRelays.length === 0) {
      setSelectedRelays(userRelays);
    }
  }, [open, userRelays, selectedRelays.length]);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setImage(existingImage || "");
      setSummary(existingSummary || "");
      setIsPublishing(false);
    }
  }, [open, existingImage, existingSummary]);

  function toggleRelay(relay: string) {
    setSelectedRelays((prev) => {
      const isSelected = prev.includes(relay);
      const newSelection = isSelected
        ? prev.filter((r) => r !== relay)
        : [...prev, relay];

      // Prevent deselecting all relays
      if (newSelection.length === 0) {
        toast.error("At least one relay must be selected");
        return prev;
      }

      return newSelection;
    });
  }

  async function handlePublish() {
    if (selectedRelays.length === 0) {
      toast.error("Please select at least one relay");
      return;
    }

    setIsPublishing(true);

    try {
      // Extract content (everything after first H1)
      const lines = markdown.split("\n");
      let foundH1 = false;
      const contentLines: string[] = [];

      for (const line of lines) {
        if (!foundH1 && /^#\s+/.test(line)) {
          foundH1 = true;
          continue;
        }
        if (foundH1) {
          contentLines.push(line);
        }
      }

      // Clean up content: remove trailing newlines with # character
      const content = contentLines
        .join("\n")
        .trim()
        .replace(/\n#\s*$/g, "");

      const redirectUrl = await onPublish({
        title,
        content,
        image: image || undefined,
        summary: summary || undefined,
        relays: selectedRelays,
        alt: `${title} - read it in ${window.location.origin}${articleUrl}`,
      });

      // Success - close dialog first, then navigate
      setIsPublishing(false);
      onOpenChange(false);

      // Navigate to the published article
      if (redirectUrl) {
        navigate(redirectUrl);
      }
    } catch (error) {
      // Error toasts are shown in onPublish, just log here
      console.error("[publish-dialog] Failed to publish:", error);
      setIsPublishing(false);
    }
  }

  function handleImageUpload(url: string) {
    setImage(url);
    setImageUploadOpen(false);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Publish Article</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Article Content - tight grouping */}
            <div className="space-y-2">
              {/* Article Title */}
              <div className="text-2xl font-bold">{title || "Untitled"}</div>

              {/* Article Image */}
              {image ? (
                <div className="relative group">
                  <img
                    src={image}
                    alt="Article cover"
                    className="w-full rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-lg">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setImageUploadOpen(true)}
                    >
                      <Upload className="size-4 mr-2" />
                      Change
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setImage("")}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full h-32 border-dashed"
                  onClick={() => setImageUploadOpen(true)}
                >
                  <ImageIcon className="size-6 mr-2" />
                  Upload Cover Image
                </Button>
              )}

              {/* Article Summary */}
              <Textarea
                id="summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Write a brief summary..."
                className="min-h-[100px]"
                rows={4}
              />
            </div>

            {/* Relay Selection Accordion */}
            <div className="border rounded-lg">
              <button
                type="button"
                onClick={() => setRelaysExpanded(!relaysExpanded)}
                className="w-full flex items-center justify-between p-3 hover:bg-accent/50 transition-colors rounded-lg"
              >
                <span className="text-sm font-medium">Publish to Relays</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {selectedRelays.length}/{userRelays.length}
                  </span>
                  {relaysExpanded ? (
                    <ChevronUp className="size-4" />
                  ) : (
                    <ChevronDown className="size-4" />
                  )}
                </div>
              </button>

              {relaysExpanded && (
                <div className="border-t p-3 space-y-2 max-h-[200px] overflow-y-auto">
                  {userRelays.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No relays configured
                    </p>
                  ) : (
                    userRelays.map((relay) => (
                      <label
                        key={relay}
                        className="flex items-center gap-2 cursor-pointer px-2 py-1 rounded hover:bg-accent"
                      >
                        <input
                          type="checkbox"
                          checked={selectedRelays.includes(relay)}
                          onChange={() => toggleRelay(relay)}
                          className="h-4 w-4"
                        />
                        <span className="text-sm flex-1 truncate" title={relay}>
                          {relay}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* URL Preview at bottom */}
            {articleUrl && (
              <div className="text-sm text-muted-foreground pt-2">
                {window.location.origin}
                {articleUrl}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPublishing}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePublish}
              disabled={isPublishing || selectedRelays.length === 0}
            >
              {isPublishing ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                "Publish"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImageUploadDialog
        open={imageUploadOpen}
        onOpenChange={setImageUploadOpen}
        onUpload={handleImageUpload}
      />
    </>
  );
}
