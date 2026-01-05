import type { JSONContent } from "@tiptap/react";
import type { NostrEvent } from "nostr-tools";

export interface Draft {
  id: string; // UUID for the draft
  title: string; // Article title
  json: JSONContent; // TipTap JSON content
  article?: NostrEvent; // Optional linked published article
  createdAt: number; // Timestamp
  updatedAt: number; // Last modified timestamp
}

const DRAFTS_KEY = "habla:drafts";
const MAX_DRAFTS = 50;

/**
 * Get all drafts from localStorage, sorted by updatedAt descending
 */
export function getDrafts(): Draft[] {
  try {
    const item = localStorage.getItem(DRAFTS_KEY);
    if (!item) return [];

    const drafts = JSON.parse(item) as Draft[];
    return drafts.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (error) {
    console.error("Failed to load drafts:", error);
    return [];
  }
}

/**
 * Get a specific draft by ID
 */
export function getDraft(id: string): Draft | null {
  const drafts = getDrafts();
  return drafts.find((d) => d.id === id) || null;
}

/**
 * Save or update a draft
 */
export function saveDraft(draft: Draft): void {
  try {
    const drafts = getDrafts();
    const existingIndex = drafts.findIndex((d) => d.id === draft.id);

    if (existingIndex >= 0) {
      // Update existing draft
      drafts[existingIndex] = { ...draft, updatedAt: Date.now() };
    } else {
      // Add new draft
      drafts.push({ ...draft, updatedAt: Date.now() });
    }

    // Keep only the last MAX_DRAFTS
    const limitedDrafts = drafts
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, MAX_DRAFTS);

    localStorage.setItem(DRAFTS_KEY, JSON.stringify(limitedDrafts));
  } catch (error) {
    console.error("Failed to save draft:", error);
  }
}

/**
 * Delete a specific draft by ID
 */
export function deleteDraft(id: string): void {
  try {
    const drafts = getDrafts();
    const filtered = drafts.filter((d) => d.id !== id);
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Failed to delete draft:", error);
  }
}

/**
 * Clear all drafts
 */
export function clearAllDrafts(): void {
  try {
    localStorage.removeItem(DRAFTS_KEY);
  } catch (error) {
    console.error("Failed to clear drafts:", error);
  }
}

/**
 * Generate a UUID v4
 */
export function generateDraftId(): string {
  return crypto.randomUUID();
}

/**
 * Check if a draft has meaningful content (not just default)
 */
export function hasMeaningfulContent(draft: Draft): boolean {
  if (!draft.title || draft.title.trim() === "") return false;

  // Check if content is more than just the default heading
  const hasContent = draft.json.content && draft.json.content.length > 1;
  if (hasContent) return true;

  // Check if the first node has meaningful text
  const firstNode = draft.json.content?.[0];
  if (!firstNode) return false;

  const text = firstNode.content?.[0]?.text || "";
  return text.trim() !== "" && text.trim() !== "An article title";
}

/**
 * Format relative time for draft display
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;

  const date = new Date(timestamp);
  return date.toLocaleDateString();
}
