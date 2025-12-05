import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/ui/dialog";
import { Button } from "~/ui/button";
import { Label } from "~/ui/label";
import { Upload, X, Check, Loader2, AlertCircle } from "lucide-react";
import { useBlossomServers } from "~/hooks/blossom/use-blossom-servers.client";
import { uploadToBlossomServers } from "~/services/blossom/upload.client";
import type { UploadProgress } from "~/services/blossom/upload.client";
import { useActiveAccount } from "applesauce-react/hooks";
import { toast } from "sonner";

interface ImageUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (url: string) => void;
  initialFile?: File | null;
}

export default function ImageUploadDialog({
  open,
  onOpenChange,
  onUpload,
  initialFile,
}: ImageUploadDialogProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedServers, setSelectedServers] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
    null,
  );
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const account = useActiveAccount();
  const { servers, isLoading: serversLoading } = useBlossomServers(
    account?.pubkey,
  );

  // Debug logging
  useEffect(() => {
    console.log("[dialog] servers:", servers);
    console.log("[dialog] serversLoading:", serversLoading);
    console.log("[dialog] file:", file);
    console.log("[dialog] isUploading:", isUploading);
  }, [servers, serversLoading, file, isUploading]);

  // Initialize with first server selected by default
  useEffect(() => {
    if (servers.length > 0 && selectedServers.length === 0) {
      setSelectedServers([servers[0]]); // Default to first server only
    }
  }, [servers]);

  // Ensure at least one server is always selected
  useEffect(() => {
    if (selectedServers.length === 0 && servers.length > 0) {
      setSelectedServers([servers[0]]);
    }
  }, [selectedServers, servers]);

  // Handle initial file if provided
  useEffect(() => {
    if (initialFile && open) {
      handleFile(initialFile);
    }
  }, [initialFile, open]);

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find((f) => f.type.startsWith("image/"));
    if (imageFile) {
      handleFile(imageFile);
    }
  }

  function handleFile(selectedFile: File) {
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  }

  function toggleServer(server: string) {
    setSelectedServers((prev) => {
      const isSelected = prev.includes(server);
      const newSelection = isSelected
        ? prev.filter((s) => s !== server)
        : [...prev, server];

      // Prevent deselecting the last server
      if (newSelection.length === 0) {
        return prev;
      }

      return newSelection;
    });
  }

  async function handleUpload() {
    if (!file || !account?.signer || selectedServers.length === 0) return;

    setIsUploading(true);
    setUploadProgress(null);

    try {
      // Create a simple signer function from account.signer
      const signerFn = (event: any) => account.signer.signEvent(event);

      const metadata = await uploadToBlossomServers(
        file,
        selectedServers,
        signerFn,
        (progress) => {
          setUploadProgress(progress);

          // Show error toasts for failed uploads
          progress.statuses.forEach((status) => {
            if (status.status === "error" && status.error) {
              toast.error(`Failed to upload to ${status.server}`, {
                description: status.error,
              });
            }
          });
        },
      );

      // Show success toast
      toast.success("Image uploaded successfully", {
        description: `Uploaded to ${metadata.servers.length} server${metadata.servers.length > 1 ? "s" : ""}`,
      });

      // Return the primary Blossom URL
      onUpload(metadata.url);
      handleClose();
    } catch (error) {
      console.error("[blossom] Upload failed:", error);
      toast.error("Failed to upload image", {
        description:
          error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setIsUploading(false);
    }
  }

  function handleClose() {
    if (isUploading) return; // Prevent closing during upload

    setPreview(null);
    setFile(null);
    setIsDragging(false);
    setUploadProgress(null);
    onOpenChange(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleRemove() {
    setPreview(null);
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  const canUpload = file && selectedServers.length > 0 && !isUploading;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Image to Blossom</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Image Preview or Drop Zone */}
          {preview ? (
            <div className="relative">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-auto max-h-64 object-contain rounded-md border border-border"
              />
              {!isUploading && (
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={handleRemove}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              {file && (
                <p className="text-sm text-muted-foreground mt-2 truncate">
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>
          ) : (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                flex flex-col items-center justify-center
                min-h-48 p-6 rounded-md border-2 border-dashed
                cursor-pointer transition-colors
                ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }
              `}
            >
              <Upload
                className={`h-12 w-12 mb-4 ${
                  isDragging ? "text-primary" : "text-muted-foreground"
                }`}
              />
              <p className="text-sm font-medium mb-1">
                Drop an image here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, GIF, WebP up to 10MB
              </p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileInput}
            disabled={isUploading}
          />

          {/* Server Selection */}
          {file && !isUploading && (
            <div className="flex flex-col gap-2">
              <Label>Upload to Blossom Servers:</Label>
              <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                {serversLoading ? (
                  <p className="text-sm text-muted-foreground">
                    Loading servers...
                  </p>
                ) : (
                  servers.map((server) => (
                    <label
                      key={server}
                      className="flex items-center gap-2 cursor-pointer px-2 py-1 rounded hover:bg-accent"
                    >
                      <input
                        type="checkbox"
                        checked={selectedServers.includes(server)}
                        onChange={() => toggleServer(server)}
                        className="h-4 w-4"
                      />
                      <span className="text-sm truncate">{server}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {uploadProgress && (
            <div className="flex flex-col gap-2">
              <Label>Upload Status:</Label>
              <div className="flex flex-col gap-1 text-sm">
                {uploadProgress.statuses.map((status) => (
                  <div
                    key={status.server}
                    className="flex items-center gap-2 p-2 rounded bg-accent/50"
                  >
                    {status.status === "uploading" && (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    )}
                    {status.status === "success" && (
                      <Check className="h-4 w-4 text-green-600" />
                    )}
                    {status.status === "error" && (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    {status.status === "pending" && (
                      <div className="h-4 w-4 rounded-full border-2 border-muted" />
                    )}
                    <span className="truncate flex-1">{status.server}</span>
                    {status.status === "error" && status.error && (
                      <span className="text-xs text-red-600">
                        {status.error}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              {uploadProgress.isComplete && (
                <p className="text-sm text-muted-foreground">
                  Uploaded to {uploadProgress.successCount} of{" "}
                  {uploadProgress.statuses.length} servers
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={!canUpload}>
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
