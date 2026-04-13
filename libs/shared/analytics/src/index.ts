/**
 * Analytics Library
 * 
 * Provides analytics tracking with PII filtering and opt-out support
 */

export { analyticsService, AnalyticsService } from './lib/analytics-service';

export {
  AnalyticsEvent,
  type AnalyticsEventProperties,
  type AnalyticsUserProperties,
  type AnalyticsConfig,
  PII_PATTERNS,
  SENSITIVE_KEYS,
} from './lib/types';

export {
  filterPIIFromString,
  filterPIIFromProperties,
  isSensitiveKey,
  validateNoPII,
} from './lib/pii-filter';

export {
  analyticsTracker,
  EngagementTracker,
  PerformanceTracker,
  ErrorTracker,
  RetentionTracker,
} from './lib/analytics-tracker';
