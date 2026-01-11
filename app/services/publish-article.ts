import type { NostrEvent } from "nostr-tools";
import pool from "~/services/relay-pool";

export interface RelayPublishStatus {
  relay: string;
  status: "pending" | "publishing" | "success" | "error";
  message?: string;
}

export interface PublishProgress {
  statuses: RelayPublishStatus[];
  isComplete: boolean;
  successCount: number;
  errorCount: number;
}

/**
 * Publish an event to multiple relays with per-relay status tracking
 * @param event - Signed Nostr event to publish
 * @param relays - Array of relay URLs to publish to
 * @param onProgress - Callback for progress updates
 * @returns Promise with final publish results
 */
export async function publishToRelays(
  event: NostrEvent,
  relays: string[],
  onProgress?: (progress: PublishProgress) => void,
): Promise<PublishProgress> {
  // Initialize relay statuses
  const statuses: RelayPublishStatus[] = relays.map((relay) => ({
    relay,
    status: "pending",
  }));

  // Update progress helper
  const updateProgress = () => {
    if (onProgress) {
      const successCount = statuses.filter(
        (s) => s.status === "success",
      ).length;
      const errorCount = statuses.filter((s) => s.status === "error").length;
      const isComplete = successCount + errorCount === relays.length;

      onProgress({
        statuses: [...statuses],
        isComplete,
        successCount,
        errorCount,
      });
    }
  };

  // Publish to each relay in parallel
  const publishPromises = relays.map(async (relay, index) => {
    try {
      statuses[index].status = "publishing";
      updateProgress();

      // Publish to relay using RelayPool
      const response = await pool.publish([relay], event);

      // Check if publish was successful
      const result = response[0];
      if (result && result.ok) {
        statuses[index].status = "success";
      } else {
        statuses[index].status = "error";
        statuses[index].message = result?.message || "Publish failed";
      }

      updateProgress();
      return result;
    } catch (error) {
      console.error(`[publish] Failed to publish to ${relay}:`, error);
      statuses[index].status = "error";
      statuses[index].message =
        error instanceof Error ? error.message : "Publish failed";
      updateProgress();
      return null;
    }
  });

  // Wait for all publishes to complete or timeout
  await Promise.allSettled(publishPromises);

  // Calculate final counts
  const successCount = statuses.filter((s) => s.status === "success").length;
  const errorCount = statuses.filter((s) => s.status === "error").length;

  return {
    statuses,
    isComplete: true,
    successCount,
    errorCount,
  };
}
