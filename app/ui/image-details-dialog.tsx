import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/ui/dialog";
import { Button } from "~/ui/button";
import { Label } from "~/ui/label";
import { Input } from "~/ui/input";
import { blossomMetadataStore } from "~/services/blossom/metadata-store";
import type { BlossomFileMetadata } from "~/services/blossom/metadata-store";

interface ImageDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  imageAlt: string;
  onSave: (alt: string) => void;
}

export default function ImageDetailsDialog({
  open,
  onOpenChange,
  imageUrl,
  imageAlt,
  onSave,
}: ImageDetailsDialogProps) {
  const [alt, setAlt] = useState(imageAlt);
  const [metadata, setMetadata] = useState<BlossomFileMetadata | null>(null);

  // Reset alt text when dialog opens with new image
  useEffect(() => {
    if (open) {
      setAlt(imageAlt);

      // Try to extract hash from Blossom URL and load metadata
      const hash = extractHashFromUrl(imageUrl);
      if (hash) {
        const meta = blossomMetadataStore.get(hash);
        setMetadata(meta || null);
      } else {
        setMetadata(null);
      }
    }
  }, [open, imageAlt, imageUrl]);

  function extractHashFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const filename = urlObj.pathname.split("/").pop();
      if (filename) {
        // Remove extension to get hash
        const hash = filename.split(".")[0];
        return hash;
      }
    } catch (error) {
      console.error("[image-details] Failed to parse URL:", error);
    }
    return null;
  }

  function handleSave() {
    onSave(alt);
    onOpenChange(false);
  }

  function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Image Details</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Image Preview */}
          <div className="flex justify-center">
            <img
              src={imageUrl}
              alt={alt}
              className="max-h-48 w-auto rounded border border-border"
            />
          </div>

          {/* Image URL (read-only) */}
          <div className="flex flex-col gap-2">
            <Label>Image URL</Label>
            <Input value={imageUrl} readOnly className="font-mono text-xs" />
          </div>

          {/* Alt Text (editable) */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="alt-text">Alt Text</Label>
            <Input
              id="alt-text"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="Describe the image..."
            />
          </div>

          {/* Blossom Metadata */}
          {metadata && (
            <div className="flex flex-col gap-2">
              <Label>Blossom Metadata</Label>
              <div className="rounded border border-border p-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hash:</span>
                  <span className="font-mono text-xs truncate ml-2">
                    {metadata.hash.slice(0, 16)}...
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span>{metadata.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Size:</span>
                  <span>{formatBytes(metadata.size)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Servers:</span>
                  <span>{metadata.servers.length}</span>
                </div>
                {metadata.blurhash && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Blurhash:</span>
                    <span className="font-mono text-xs">
                      {metadata.blurhash.slice(0, 12)}...
                    </span>
                  </div>
                )}
                <div className="pt-2 border-t border-border">
                  <span className="text-muted-foreground">Uploaded to:</span>
                  <ul className="mt-1 space-y-0.5">
                    {metadata.servers.map((server) => (
                      <li key={server} className="text-xs truncate ml-2">
                        • {server}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
