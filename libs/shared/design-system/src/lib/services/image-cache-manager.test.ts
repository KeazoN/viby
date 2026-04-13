/**
 * ImageCacheManager Unit Tests
 * 
 * Tests for image cache management with LRU eviction policy.
 */

import { ImageCacheManager } from './image-cache-manager';
import { storageService } from '@viby/shared/storage';
import FastImage from 'react-native-fast-image';

// Mock dependencies
jest.mock('@viby/shared/storage');
jest.mock('react-native-fast-image', () => ({
  clearMemoryCache: jest.fn().mockResolvedValue(undefined),
  clearDiskCache: jest.fn().mockResolvedValue(undefined),
  priority: {
    high: 'high',
    normal: 'normal',
    low: 'low',
  },
  cacheControl: {
    immutable: 'immutable',
  },
  resizeMode: {
    contain: 'contain',
    cover: 'cover',
    stretch: 'stretch',
    center: 'center',
  },
}));

describe('ImageCacheManager', () => {
  let cacheManager: ImageCacheManager;
  const mockStorageService = storageService as jest.Mocked<typeof storageService>;

  beforeEach(() => {
    jest.clearAllMocks();
    cacheManager = new ImageCacheManager();
    mockStorageService.getObject.mockResolvedValue(null);
    mockStorageService.setObject.mockResolvedValue(undefined);
  });

  describe('initialization', () => {
    it('should initialize with empty metadata when no stored data', async () => {
      mockStorageService.getObject.mockResolvedValue(null);

      await cacheManager.initialize();
      const size = await cacheManager.getCacheSize();

      expect(size).toBe(0);
    });

    it('should load existing metadata from storage', async () => {
      const existingMetadata = {
        entries: {
          'https://example.com/image1.jpg': {
            uri: 'https://example.com/image1.jpg',
            size: 50000,
            lastAccessed: Date.now(),
          },
        },
        totalSize: 50000,
      };

      mockStorageService.getObject.mockResolvedValue(existingMetadata);

      await cacheManager.initialize();
      const size = await cacheManager.getCacheSize();

      expect(size).toBe(50000);
    });

    it('should handle storage errors gracefully', async () => {
      mockStorageService.getObject.mockRejectedValue(new Error('Storage error'));

      await cacheManager.initialize();
      const size = await cacheManager.getCacheSize();

      expect(size).toBe(0);
    });
  });

  describe('trackImageAccess', () => {
    it('should track new image access', async () => {
      const uri = 'https://example.com/image.jpg';
      const size = 50000;

      await cacheManager.trackImageAccess(uri, size);

      const cacheSize = await cacheManager.getCacheSize();
      const isInCache = await cacheManager.isInCache(uri);

      expect(cacheSize).toBe(size);
      expect(isInCache).toBe(true);
    });

    it('should update last accessed time for existing image', async () => {
      const uri = 'https://example.com/image.jpg';
      const size = 50000;

      await cacheManager.trackImageAccess(uri, size);
      const initialSize = await cacheManager.getCacheSize();

      // Access again
      await cacheManager.trackImageAccess(uri, size);
      const finalSize = await cacheManager.getCacheSize();

      // Size should not increase for existing image
      expect(finalSize).toBe(initialSize);
    });

    it('should use default size when not provided', async () => {
      const uri = 'https://example.com/image.jpg';

      await cacheManager.trackImageAccess(uri);

      const isInCache = await cacheManager.isInCache(uri);
      expect(isInCache).toBe(true);
    });
  });

  describe('LRU eviction', () => {
    it('should evict oldest images when cache exceeds 100MB', async () => {
      const imageSize = 30 * 1024 * 1024; // 30MB per image

      // Add 4 images (120MB total, exceeds 100MB limit)
      await cacheManager.trackImageAccess('https://example.com/image1.jpg', imageSize);
      await new Promise(resolve => setTimeout(resolve, 10)); // Ensure different timestamps
      
      await cacheManager.trackImageAccess('https://example.com/image2.jpg', imageSize);
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await cacheManager.trackImageAccess('https://example.com/image3.jpg', imageSize);
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await cacheManager.trackImageAccess('https://example.com/image4.jpg', imageSize);

      const finalSize = await cacheManager.getCacheSize();
      const stats = await cacheManager.getCacheStats();

      // Should have evicted oldest images to stay under 100MB
      expect(finalSize).toBeLessThanOrEqual(100 * 1024 * 1024);
      expect(FastImage.clearMemoryCache).toHaveBeenCalled();
      expect(FastImage.clearDiskCache).toHaveBeenCalled();
    });

    it('should not evict when cache is under limit', async () => {
      const imageSize = 20 * 1024 * 1024; // 20MB per image

      // Add 3 images (60MB total, under 100MB limit)
      await cacheManager.trackImageAccess('https://example.com/image1.jpg', imageSize);
      await cacheManager.trackImageAccess('https://example.com/image2.jpg', imageSize);
      await cacheManager.trackImageAccess('https://example.com/image3.jpg', imageSize);

      const count = await cacheManager.getCacheCount();

      expect(count).toBe(3);
      expect(FastImage.clearMemoryCache).not.toHaveBeenCalled();
    });
  });

  describe('cache operations', () => {
    it('should get cache size in bytes', async () => {
      await cacheManager.trackImageAccess('https://example.com/image.jpg', 50000);

      const size = await cacheManager.getCacheSize();

      expect(size).toBe(50000);
    });

    it('should get cache size in MB', async () => {
      await cacheManager.trackImageAccess('https://example.com/image.jpg', 1024 * 1024);

      const sizeMB = await cacheManager.getCacheSizeMB();

      expect(sizeMB).toBe(1);
    });

    it('should get cache count', async () => {
      await cacheManager.trackImageAccess('https://example.com/image1.jpg', 50000);
      await cacheManager.trackImageAccess('https://example.com/image2.jpg', 50000);

      const count = await cacheManager.getCacheCount();

      expect(count).toBe(2);
    });

    it('should clear all cached images', async () => {
      await cacheManager.trackImageAccess('https://example.com/image1.jpg', 50000);
      await cacheManager.trackImageAccess('https://example.com/image2.jpg', 50000);

      await cacheManager.clearCache();

      const size = await cacheManager.getCacheSize();
      const count = await cacheManager.getCacheCount();

      expect(size).toBe(0);
      expect(count).toBe(0);
      expect(FastImage.clearMemoryCache).toHaveBeenCalled();
      expect(FastImage.clearDiskCache).toHaveBeenCalled();
    });

    it('should remove specific image from cache', async () => {
      const uri = 'https://example.com/image.jpg';
      await cacheManager.trackImageAccess(uri, 50000);

      await cacheManager.removeFromCache(uri);

      const isInCache = await cacheManager.isInCache(uri);
      const size = await cacheManager.getCacheSize();

      expect(isInCache).toBe(false);
      expect(size).toBe(0);
    });

    it('should check if image is in cache', async () => {
      const uri = 'https://example.com/image.jpg';

      let isInCache = await cacheManager.isInCache(uri);
      expect(isInCache).toBe(false);

      await cacheManager.trackImageAccess(uri, 50000);

      isInCache = await cacheManager.isInCache(uri);
      expect(isInCache).toBe(true);
    });
  });

  describe('cache statistics', () => {
    it('should return accurate cache statistics', async () => {
      await cacheManager.trackImageAccess('https://example.com/image1.jpg', 50 * 1024 * 1024);
      await cacheManager.trackImageAccess('https://example.com/image2.jpg', 30 * 1024 * 1024);

      const stats = await cacheManager.getCacheStats();

      expect(stats.count).toBe(2);
      expect(stats.totalSize).toBe(80 * 1024 * 1024);
      expect(stats.totalSizeMB).toBe(80);
      expect(stats.limitMB).toBe(100);
      expect(stats.usagePercent).toBe(80);
    });
  });

  describe('persistence', () => {
    it('should save metadata to storage after tracking', async () => {
      await cacheManager.trackImageAccess('https://example.com/image.jpg', 50000);

      expect(mockStorageService.setObject).toHaveBeenCalledWith(
        'image_cache_metadata',
        expect.objectContaining({
          totalSize: 50000,
          entries: expect.any(Object),
        })
      );
    });

    it('should save metadata after clearing cache', async () => {
      await cacheManager.trackImageAccess('https://example.com/image.jpg', 50000);
      jest.clearAllMocks();

      await cacheManager.clearCache();

      expect(mockStorageService.setObject).toHaveBeenCalledWith(
        'image_cache_metadata',
        {
          entries: {},
          totalSize: 0,
        }
      );
    });
  });
});
