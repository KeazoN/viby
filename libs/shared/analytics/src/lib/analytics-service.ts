/**
 * Analytics Service
 * 
 * Provides analytics tracking with PII filtering and opt-out support
 * Uses Firebase Analytics for React Native
 */

import { storageService } from '@viby/shared/storage';
import {
  AnalyticsEvent,
  AnalyticsEventProperties,
  AnalyticsUserProperties,
  AnalyticsConfig,
} from './types';
import { filterPIIFromProperties, validateNoPII } from './pii-filter';

// Firebase Analytics will be initialized lazily
let analytics: any = null;
let isInitialized = false;

const ANALYTICS_ENABLED_KEY = 'analytics_enabled';
const ANALYTICS_BATCH_KEY = 'analytics_batch';
const DEFAULT_BATCH_SIZE = 10;
const DEFAULT_FLUSH_INTERVAL = 30000; // 30 seconds

/**
 * Analytics Service
 * 
 * Handles all analytics tracking with automatic PII filtering
 */
export class AnalyticsService {
  private config: AnalyticsConfig;
  private eventBatch: Array<{ event: string; properties: AnalyticsEventProperties }> = [];
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = {
      enabled: true,
      debug: false,
      batchSize: DEFAULT_BATCH_SIZE,
      flushInterval: DEFAULT_FLUSH_INTERVAL,
      ...config,
    };
  }

  /**
   * Initialize Firebase Analytics
   */
  async initialize(): Promise<void> {
    if (isInitialized) {
      return;
    }

    try {
      // Check if user has opted out
      const isEnabled = storageService.getBoolean(ANALYTICS_ENABLED_KEY);
      if (isEnabled === false) {
        this.config.enabled = false;
        if (this.config.debug) {
          console.log('[Analytics] User has opted out of analytics');
        }
        return;
      }

      // Dynamically import Firebase Analytics
      // Note: In a real implementation, you would use @react-native-firebase/analytics
      // For now, we'll use a mock implementation that can be replaced
      if (this.config.debug) {
        console.log('[Analytics] Initializing analytics service');
      }

      // TODO: Replace with actual Firebase Analytics initialization
      // const firebaseAnalytics = await import('@react-native-firebase/analytics');
      // analytics = firebaseAnalytics.default();

      isInitialized = true;

      // Start flush timer
      this.startFlushTimer();

      if (this.config.debug) {
        console.log('[Analytics] Analytics service initialized');
      }
    } catch (error) {
      console.error('[Analytics] Failed to initialize analytics:', error);
      this.config.enabled = false;
    }
  }

  /**
   * Track an analytics event
   */
  async trackEvent(
    event: AnalyticsEvent | string,
    properties: AnalyticsEventProperties = {}
  ): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    try {
      // Filter PII from properties
      const filteredProperties = filterPIIFromProperties(properties);

      // Validate no PII remains
      if (!validateNoPII(filteredProperties)) {
        console.error('[Analytics] Event blocked: PII detected after filtering');
        return;
      }

      // Add to batch
      this.eventBatch.push({
        event: event.toString(),
        properties: filteredProperties,
      });

      if (this.config.debug) {
        console.log('[Analytics] Event tracked:', event, filteredProperties);
      }

      // Flush if batch is full
      if (this.eventBatch.length >= (this.config.batchSize || DEFAULT_BATCH_SIZE)) {
        await this.flush();
      }
    } catch (error) {
      console.error('[Analytics] Failed to track event:', error);
    }
  }

  /**
   * Track a screen view
   */
  async trackScreenView(screenName: string, properties: AnalyticsEventProperties = {}): Promise<void> {
    await this.trackEvent(AnalyticsEvent.SCREEN_VIEW, {
      screen_name: screenName,
      ...properties,
    });
  }

  /**
   * Set user properties
   */
  async setUserProperties(properties: AnalyticsUserProperties): Promise<void> {
    if (!this.config.enabled || !isInitialized) {
      return;
    }

    try {
      // Filter PII from user properties
      const filteredProperties = filterPIIFromProperties(properties);

      if (this.config.debug) {
        console.log('[Analytics] User properties set:', filteredProperties);
      }

      // TODO: Replace with actual Firebase Analytics call
      // await analytics.setUserProperties(filteredProperties);
    } catch (error) {
      console.error('[Analytics] Failed to set user properties:', error);
    }
  }

  /**
   * Set user ID
   */
  async setUserId(userId: string | null): Promise<void> {
    if (!this.config.enabled || !isInitialized) {
      return;
    }

    try {
      if (this.config.debug) {
        console.log('[Analytics] User ID set:', userId ? '[REDACTED]' : 'null');
      }

      // TODO: Replace with actual Firebase Analytics call
      // await analytics.setUserId(userId);
    } catch (error) {
      console.error('[Analytics] Failed to set user ID:', error);
    }
  }

  /**
   * Enable analytics tracking
   */
  async enableAnalytics(): Promise<void> {
    this.config.enabled = true;
    storageService.setBoolean(ANALYTICS_ENABLED_KEY, true);

    if (!isInitialized) {
      await this.initialize();
    }

    if (this.config.debug) {
      console.log('[Analytics] Analytics enabled');
    }
  }

  /**
   * Disable analytics tracking (opt-out)
   */
  async disableAnalytics(): Promise<void> {
    this.config.enabled = false;
    storageService.setBoolean(ANALYTICS_ENABLED_KEY, false);

    // Clear any pending events
    this.eventBatch = [];

    // Stop flush timer
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    if (this.config.debug) {
      console.log('[Analytics] Analytics disabled');
    }
  }

  /**
   * Check if analytics is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Flush pending events
   */
  async flush(): Promise<void> {
    if (this.eventBatch.length === 0) {
      return;
    }

    try {
      const batch = [...this.eventBatch];
      this.eventBatch = [];

      if (this.config.debug) {
        console.log(`[Analytics] Flushing ${batch.length} events`);
      }

      // Send events to Firebase Analytics
      for (const { event, properties } of batch) {
        // TODO: Replace with actual Firebase Analytics call
        // await analytics.logEvent(event, properties);
        
        // For now, just log in debug mode
        if (this.config.debug) {
          console.log('[Analytics] Event sent:', event, properties);
        }
      }
    } catch (error) {
      console.error('[Analytics] Failed to flush events:', error);
    }
  }

  /**
   * Start automatic flush timer
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval || DEFAULT_FLUSH_INTERVAL);
  }

  /**
   * Reset analytics (clear all data)
   */
  async reset(): Promise<void> {
    this.eventBatch = [];
    await this.setUserId(null);

    if (this.config.debug) {
      console.log('[Analytics] Analytics reset');
    }
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService({
  debug: __DEV__,
});
