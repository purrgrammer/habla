import { Actions, createUploadAuth } from "blossom-client-sdk";
import type { EventTemplate, NostrEvent } from "nostr-tools";
import type { BlossomFileMetadata } from "./metadata-store";
import { blossomMetadataStore } from "./metadata-store";

const { uploadBlob } = Actions;

export interface UploadStatus {
  server: string;
  status: "pending" | "uploading" | "success" | "error";
  progress?: number;
  error?: string;
  url?: string;
}

export interface UploadProgress {
  statuses: UploadStatus[];
  isComplete: boolean;
  successCount: number;
  errorCount: number;
}

/**
 * Calculate SHA-256 hash of a file
 */
async function calculateFileHash(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
}

/**
 * Get file extension from MIME type
 */
function getExtensionFromType(type: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/svg+xml": "svg",
  };
  return map[type] || "jpg";
}

/**
 * Upload a file to multiple Blossom servers
 * @param file - File to upload
 * @param servers - Array of server URLs to upload to
 * @param signer - Nostr signer function (EventTemplate => Promise<NostrEvent>)
 * @param onProgress - Callback for upload progress updates
 * @returns Promise with metadata of uploaded file
 */
export async function uploadToBlossomServers(
  file: File,
  servers: string[],
  signer: (event: EventTemplate) => Promise<NostrEvent>,
  onProgress?: (progress: UploadProgress) => void,
): Promise<BlossomFileMetadata> {
  // Calculate file hash
  const hash = await calculateFileHash(file);
  const ext = getExtensionFromType(file.type);

  // Initialize upload statuses
  const statuses: UploadStatus[] = servers.map((server) => ({
    server,
    status: "pending",
  }));

  // Update progress helper
  const updateProgress = () => {
    if (onProgress) {
      const successCount = statuses.filter(
        (s) => s.status === "success",
      ).length;
      const errorCount = statuses.filter((s) => s.status === "error").length;
      const isComplete = successCount + errorCount === servers.length;

      onProgress({
        statuses: [...statuses],
        isComplete,
        successCount,
        errorCount,
      });
    }
  };

  // Upload to each server in parallel
  const uploadPromises = servers.map(async (server, index) => {
    try {
      statuses[index].status = "uploading";
      updateProgress();

      // Upload blob using blossom-client-sdk
      // Use createUploadAuth to generate the auth event
      const blob = await uploadBlob(server, file, {
        onAuth: async (srv, sha256, authType) => {
          return await createUploadAuth(signer, sha256, { type: authType });
        },
      });

      statuses[index].status = "success";
      statuses[index].url = `${server}/${hash}.${ext}`;
      updateProgress();

      return blob;
    } catch (error) {
      console.error(`[blossom] Upload to ${server} failed:`, error);
      statuses[index].status = "error";
      statuses[index].error =
        error instanceof Error ? error.message : "Upload failed";
      updateProgress();
      return null;
    }
  });

  // Wait for all uploads to complete
  await Promise.all(uploadPromises);

  // Get successful uploads
  const successfulServers = statuses
    .filter((s) => s.status === "success")
    .map((s) => s.server);

  if (successfulServers.length === 0) {
    throw new Error("Failed to upload to any server");
  }

  // Create metadata
  const primaryServer = successfulServers[0];
  const metadata: BlossomFileMetadata = {
    hash,
    servers: successfulServers,
    type: file.type,
    size: file.size,
    uploaded: Date.now(),
    url: `${primaryServer}/${hash}.${ext}`,
    name: file.name,
  };

  // Store metadata locally
  blossomMetadataStore.set(metadata);

  return metadata;
}
