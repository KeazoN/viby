/**
 * Global teardown for Detox E2E tests
 * 
 * This file runs once after all tests complete.
 * Use it for cleanup tasks like:
 * - Stopping mock servers
 * - Cleaning up test databases
 * - Removing temporary files
 */

export default async function globalTeardown(): Promise<void> {
  console.log('🧹 Cleaning up after E2E tests...');
  
  // Add any global teardown logic here
  // For example:
  // - Stop mock API server
  // - Clean up test database
  // - Remove temporary files
  
  console.log('✅ Global teardown complete');
}
