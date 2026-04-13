/**
 * ImageCacheManager Service
 * 
 * Manages image cache with LRU eviction policy.
 * 
 * Requirements: 22.2, 22.3
 * - 22.2: Limit image cache size to 100MB and evict oldest images when limit is reached
 * - 22.3: When an image is requested, check cache before making a network request
 */

import FastImage from 'react-native-fast-image';
import { storageService } from '@viby/shared/storage';

interface CacheEntry {
  uri: string;
  size: number; // Estimated size in bytes
  lastAccessed: number; // Timestamp
}

interface CacheMetadata {
  entries: Record<string, CacheEntry>;
  totalSize: number;
}

const CACHE_SIZE_LIMIT = 100 * 1024 * 1024; // 100MB in bytes
const CACHE_METADATA_KEY = 'image_cache_metadata';
const AVERAGE_IMAGE_SIZE = 50 * 1024; // Estimate 50KB per image

/**
 * ImageCacheManager class for managing image cache with LRU eviction
 */
export class ImageCacheManager {
  private metadata: CacheMetadata = {
    entries: {},
    totalSize: 0,
  };
  private initialized = false;

  /**
   * Initialize the cache manager by loading metadata from storage
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      const stored = await storageService.getObject<CacheMetadata>(CACHE_METADATA_KEY);
      if (stored) {
        this.metadata = stored;
      }
    } catch (error) {
      console.error('Failed to load cache metadata:', error);
      this.metadata = { entries: {}, totalSize: 0 };
    }

    this.initialized = true;
  }

  /**
   * Track an image access and update LRU metadata
   */
  async trackImageAccess(uri: string, estimatedSize?: number): Promise<void> {
    await this.initialize();

    const size = estimatedSize || AVERAGE_IMAGE_SIZE;
    const now = Date.now();

    // Update or create entry
    const existingEntry = this.metadata.entries[uri];
    if (existingEntry) {
      // Update last accessed time
      existingEntry.lastAccessed = now;
    } else {
      // New entry
      this.metadata.entries[uri] = {
        uri,
        size,
        lastAccessed: now,
      };
      this.metadata.totalSize += size;
    }

    // Check if we need to evict
    await this.evictIfNeeded();

    // Persist metadata
    await this.saveMetadata();
  }

  /**
   * Evict least recently used images if cache exceeds limit
   */
  private async evictIfNeeded(): Promise<void> {
    if (this.metadata.totalSize <= CACHE_SIZE_LIMIT) {
      return;
    }

    // Sort entries by last accessed time (oldest first)
    const sortedEntries = Object.values(this.metadata.entries).sort(
      (a, b) => a.lastAccessed - b.lastAccessed
    );

    // Evict oldest entries until we're under the limit
    const urisToEvict: string[] = [];
    let sizeToFree = this.metadata.totalSize - CACHE_SIZE_LIMIT;

    for (const entry of sortedEntries) {
      if (sizeToFree <= 0) {
        break;
      }

      urisToEvict.push(entry.uri);
      sizeToFree -= entry.size;
      this.metadata.totalSize -= entry.size;
      delete this.metadata.entries[entry.uri];
    }

    // Clear images from FastImage cache
    if (urisToEvict.length > 0) {
      console.log(`Evicting ${urisToEvict.length} images from cache (LRU policy)`);
      // Note: FastImage doesn't provide per-image eviction, so we clear the entire cache
      // and rely on the metadata to track what should be cached
      await this.clearCache();
    }
  }

  /**
   * Get current cache size in bytes
   */
  async getCacheSize(): Promise<number> {
    await this.initialize();
    return this.metadata.totalSize;
  }

  /**
   * Get cache size in MB
   */
  async getCacheSizeMB(): Promise<number> {
    const bytes = await this.getCacheSize();
    return bytes / (1024 * 1024);
  }

  /**
   * Get number of cached images
   */
  async getCacheCount(): Promise<number> {
    await this.initialize();
    return Object.keys(this.metadata.entries).length;
  }

  /**
   * Clear all cached images
   */
  async clearCache(): Promise<void> {
    try {
      // Clear FastImage caches
      await FastImage.clearMemoryCache();
      await FastImage.clearDiskCache();

      // Reset metadata
      this.metadata = {
        entries: {},
        totalSize: 0,
      };

      await this.saveMetadata();
    } catch (error) {
      console.error('Failed to clear image cache:', error);
    }
  }

  /**
   * Remove a specific image from cache tracking
   */
  async removeFromCache(uri: string): Promise<void> {
    await this.initialize();

    const entry = this.metadata.entries[uri];
    if (entry) {
      this.metadata.totalSize -= entry.size;
      delete this.metadata.entries[uri];
      await this.saveMetadata();
    }
  }

  /**
   * Check if an image is in cache
   */
  async isInCache(uri: string): Promise<boolean> {
    await this.initialize();
    return uri in this.metadata.entries;
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    totalSize: number;
    totalSizeMB: number;
    count: number;
    limit: number;
    limitMB: number;
    usagePercent: number;
  }> {
    await this.initialize();

    return {
      totalSize: this.metadata.totalSize,
      totalSizeMB: this.metadata.totalSize / (1024 * 1024),
      count: Object.keys(this.metadata.entries).length,
      limit: CACHE_SIZE_LIMIT,
      limitMB: CACHE_SIZE_LIMIT / (1024 * 1024),
      usagePercent: (this.metadata.totalSize / CACHE_SIZE_LIMIT) * 100,
    };
  }

  /**
   * Save metadata to storage
   */
  private async saveMetadata(): Promise<void> {
    try {
      await storageService.setObject(CACHE_METADATA_KEY, this.metadata);
    } catch (error) {
      console.error('Failed to save cache metadata:', error);
    }
  }
}

// Export singleton instance
export const imageCacheManager = new ImageCacheManager();
