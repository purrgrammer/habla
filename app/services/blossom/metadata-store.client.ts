/**
 * Blossom file metadata storage using localStorage
 * Stores information about uploaded files for future reference
 */

export interface BlossomFileMetadata {
  hash: string; // SHA-256 hash of the file
  servers: string[]; // URLs of servers where file is stored
  type: string; // MIME type (e.g., "image/jpeg")
  size: number; // File size in bytes
  blurhash?: string; // Optional blurhash for progressive loading
  uploaded: number; // Timestamp when uploaded
  url: string; // Primary Blossom URL
  name?: string; // Original filename
}

const STORAGE_KEY = "blossom-metadata";

class BlossomMetadataStore {
  private cache: Map<string, BlossomFileMetadata> = new Map();
  private initialized = false;

  /**
   * Initialize the store by loading from localStorage
   */
  private init() {
    if (this.initialized) return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored) as BlossomFileMetadata[];
        data.forEach((item) => {
          this.cache.set(item.hash, item);
        });
      }
    } catch (error) {
      console.error("[blossom] Failed to load metadata:", error);
    }

    this.initialized = true;
  }

  /**
   * Save current cache to localStorage
   */
  private save() {
    try {
      const data = Array.from(this.cache.values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("[blossom] Failed to save metadata:", error);
    }
  }

  /**
   * Store metadata for an uploaded file
   */
  set(metadata: BlossomFileMetadata) {
    this.init();
    this.cache.set(metadata.hash, metadata);
    this.save();
  }

  /**
   * Get metadata for a file by hash
   */
  get(hash: string): BlossomFileMetadata | undefined {
    this.init();
    return this.cache.get(hash);
  }

  /**
   * Get all stored metadata
   */
  getAll(): BlossomFileMetadata[] {
    this.init();
    return Array.from(this.cache.values());
  }

  /**
   * Delete metadata for a file by hash
   */
  delete(hash: string) {
    this.init();
    this.cache.delete(hash);
    this.save();
  }

  /**
   * Clear all metadata
   */
  clear() {
    this.cache.clear();
    localStorage.removeItem(STORAGE_KEY);
    this.initialized = false;
  }
}

// Export singleton instance
export const blossomMetadataStore = new BlossomMetadataStore();
