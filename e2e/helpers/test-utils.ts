/**
 * Test utilities for E2E tests
 * 
 * Common utility functions that don't fit into other helper categories
 */

/**
 * Wait for a specific duration
 */
export async function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry an operation until it succeeds or max attempts reached
 */
export async function retry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts) {
        await wait(delayMs);
      }
    }
  }
  
  throw lastError || new Error('Retry failed');
}

/**
 * Generate a random string
 */
export function randomString(length: number = 10): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a random email
 */
export function randomEmail(): string {
  return `test-${randomString(8)}@viby.app`;
}

/**
 * Generate a random username
 */
export function randomUsername(): string {
  return `user_${randomString(8)}`;
}

/**
 * Format timestamp for test data
 */
export function formatTimestamp(date: Date = new Date()): string {
  return date.toISOString();
}

/**
 * Get timestamp N seconds ago
 */
export function timestampSecondsAgo(seconds: number): string {
  return new Date(Date.now() - seconds * 1000).toISOString();
}

/**
 * Get timestamp N seconds in the future
 */
export function timestampSecondsFromNow(seconds: number): string {
  return new Date(Date.now() + seconds * 1000).toISOString();
}

/**
 * Check if running on iOS
 */
export function isIOS(): boolean {
  return device.getPlatform() === 'ios';
}

/**
 * Check if running on Android
 */
export function isAndroid(): boolean {
  return device.getPlatform() === 'android';
}

/**
 * Get platform-specific test ID
 */
export function platformTestID(iosID: string, androidID: string): string {
  return isIOS() ? iosID : androidID;
}

/**
 * Execute platform-specific code
 */
export async function platformSpecific<T>(
  iosCode: () => Promise<T>,
  androidCode: () => Promise<T>
): Promise<T> {
  return isIOS() ? await iosCode() : await androidCode();
}

/**
 * Log test step for debugging
 */
export function logStep(message: string): void {
  console.log(`📝 [TEST STEP] ${message}`);
}

/**
 * Log test info
 */
export function logInfo(message: string): void {
  console.log(`ℹ️  [INFO] ${message}`);
}

/**
 * Log test warning
 */
export function logWarning(message: string): void {
  console.warn(`⚠️  [WARNING] ${message}`);
}

/**
 * Log test error
 */
export function logError(message: string, error?: Error): void {
  console.error(`❌ [ERROR] ${message}`, error);
}

/**
 * Create a test context object for sharing data between tests
 */
export function createTestContext<T extends Record<string, any>>(): T {
  return {} as T;
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Merge objects
 */
export function merge<T extends Record<string, any>>(
  target: T,
  ...sources: Partial<T>[]
): T {
  return Object.assign({}, target, ...sources);
}

/**
 * Check if value is defined
 */
export function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

/**
 * Assert value is defined (throws if not)
 */
export function assertDefined<T>(
  value: T | undefined | null,
  message?: string
): asserts value is T {
  if (!isDefined(value)) {
    throw new Error(message || 'Value is not defined');
  }
}

/**
 * Create a mock timestamp range
 */
export function createTimestampRange(
  startSecondsAgo: number,
  endSecondsAgo: number = 0
): { start: string; end: string } {
  return {
    start: timestampSecondsAgo(startSecondsAgo),
    end: timestampSecondsAgo(endSecondsAgo),
  };
}

/**
 * Sanitize string for test ID
 */
export function sanitizeTestID(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Generate test data with overrides
 */
export function generateTestData<T extends Record<string, any>>(
  defaults: T,
  overrides?: Partial<T>
): T {
  return { ...defaults, ...overrides };
}
