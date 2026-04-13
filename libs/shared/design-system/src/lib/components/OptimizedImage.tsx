/**
 * OptimizedImage Component
 * 
 * A wrapper around FastImage for optimized image loading and caching.
 * Provides better performance than React Native's default Image component.
 * 
 * Requirements: 15.7, 22.1, 22.2, 22.3, 22.4, 22.5, 22.7
 * - 15.7: Optimize images with appropriate compression and caching
 * - 22.1: Cache album artwork and user avatars locally using a disk cache
 * - 22.2: Limit image cache size to 100MB and evict oldest images when limit is reached
 * - 22.3: When an image is requested, check cache before making a network request
 * - 22.4: Display a placeholder while images are loading
 * - 22.5: Compress images to appropriate sizes based on display dimensions
 * - 22.7: If an image fails to load, display a default placeholder image
 */

import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ViewStyle, ActivityIndicator } from 'react-native';
import FastImage, { FastImageProps, Priority, ResizeMode, OnLoadEvent } from 'react-native-fast-image';
import { colors } from '../tokens';
import { imageCacheManager } from '../services/image-cache-manager';
import { Text } from './Text';

export interface OptimizedImageProps {
  /**
   * Image URI to load
   */
  uri: string;
  /**
   * Image width
   */
  width: number;
  /**
   * Image height
   */
  height: number;
  /**
   * Border radius for rounded corners
   */
  borderRadius?: number;
  /**
   * Loading priority (high, normal, low)
   * @default 'normal'
   */
  priority?: 'high' | 'normal' | 'low';
  /**
   * Resize mode
   * @default 'cover'
   */
  resizeMode?: 'contain' | 'cover' | 'stretch' | 'center';
  /**
   * Accessibility label
   */
  accessibilityLabel?: string;
  /**
   * Additional styles
   */
  style?: ViewStyle;
  /**
   * Custom placeholder component to show while loading
   * If not provided, a default loading indicator will be shown
   */
  placeholder?: React.ReactNode;
  /**
   * Show loading indicator
   * @default true
   */
  showLoadingIndicator?: boolean;
  /**
   * Custom fallback component to show on error
   * If not provided, a default error placeholder will be shown
   */
  fallback?: React.ReactNode;
  /**
   * Callback when image loads successfully
   */
  onLoad?: () => void;
  /**
   * Callback when image fails to load
   */
  onError?: () => void;
}

/**
 * OptimizedImage component using FastImage for better performance
 * 
 * Features:
 * - Automatic disk caching with LRU eviction
 * - Priority-based loading
 * - Optimized memory usage
 * - Loading placeholder support
 * - Error fallback support
 * - Cache size tracking
 * 
 * @example
 * ```tsx
 * <OptimizedImage
 *   uri="https://example.com/image.jpg"
 *   width={80}
 *   height={80}
 *   borderRadius={8}
 *   priority="high"
 *   accessibilityLabel="Album artwork"
 *   showLoadingIndicator={true}
 * />
 * ```
 */
export function OptimizedImage({
  uri,
  width,
  height,
  borderRadius = 0,
  priority = 'normal',
  resizeMode = 'cover',
  accessibilityLabel,
  style,
  placeholder,
  showLoadingIndicator = true,
  fallback,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const priorityMap: Record<string, Priority> = {
    high: FastImage.priority.high,
    normal: FastImage.priority.normal,
    low: FastImage.priority.low,
  };

  const resizeModeMap: Record<string, ResizeMode> = {
    contain: FastImage.resizeMode.contain,
    cover: FastImage.resizeMode.cover,
    stretch: FastImage.resizeMode.stretch,
    center: FastImage.resizeMode.center,
  };

  // Track image access for cache management
  useEffect(() => {
    if (uri) {
      // Estimate size based on dimensions (rough approximation)
      const estimatedSize = Math.ceil((width * height * 4) / 10); // Rough estimate
      imageCacheManager.trackImageAccess(uri, estimatedSize).catch(error => {
        console.error('Failed to track image access:', error);
      });
    }
  }, [uri, width, height]);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  // Default loading placeholder
  const defaultPlaceholder = showLoadingIndicator && (
    <View style={styles.placeholderContainer}>
      <ActivityIndicator size="small" color={colors.text.secondary} />
    </View>
  );

  // Default error fallback
  const defaultFallback = (
    <View style={styles.fallbackContainer}>
      <Text style={styles.fallbackText}>📷</Text>
    </View>
  );

  return (
    <View style={[{ width, height, borderRadius, overflow: 'hidden' }, style]}>
      {!hasError ? (
        <>
          <FastImage
            source={{
              uri,
              priority: priorityMap[priority],
              cache: FastImage.cacheControl.immutable,
            }}
            style={[styles.image, { width, height, borderRadius }]}
            resizeMode={resizeModeMap[resizeMode]}
            accessibilityLabel={accessibilityLabel}
            onLoad={handleLoad}
            onError={handleError}
          />
          {isLoading && (
            <View style={[styles.placeholder, { width, height, borderRadius }]}>
              {placeholder || defaultPlaceholder}
            </View>
          )}
        </>
      ) : (
        <View style={[styles.fallback, { width, height, borderRadius }]}>
          {fallback || defaultFallback}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.background.tertiary,
  },
  placeholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.tertiary,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallback: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.tertiary,
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackText: {
    fontSize: 32,
    opacity: 0.5,
  },
});
