/**
 * Analytics Property-Based Tests
 * 
 * Property 38: Analytics Event Batching
 * Property 39: PII Not in Analytics
 * 
 * **Validates: Requirements 23.5, 23.7**
 */

import * as fc from 'fast-check';
import { AnalyticsService } from './analytics-service';
import { AnalyticsEvent } from './types';
import { storageService } from '@viby/shared/storage';
import { filterPIIFromProperties, validateNoPII } from './pii-filter';

// Mock storage service
jest.mock('@viby/shared/storage', () => ({
  storageService: {
    getBoolean: jest.fn(),
    setBoolean: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
  },
}));

describe('Analytics Property Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // Arbitraries for generating test data
  const eventNameArb = fc.constantFrom(
    ...Object.values(AnalyticsEvent)
  );

  const safeStringArb = fc.string({ minLength: 1, maxLength: 100 }).filter(
    s => !s.includes('@') && !s.match(/\d{3}-\d{2}-\d{4}/) && !s.match(/\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/)
  );

  const safePropertiesArb = fc.record({
    screen_name: fc.option(safeStringArb, { nil: undefined }),
    user_id: fc.option(fc.uuid(), { nil: undefined }),
    count: fc.option(fc.integer({ min: 0, max: 1000 }), { nil: undefined }),
    duration_ms: fc.option(fc.integer({ min: 0, max: 60000 }), { nil: undefined }),
    is_active: fc.option(fc.boolean(), { nil: undefined }),
  });

  const emailArb = fc.emailAddress();
  const phoneArb = fc.constantFrom(
    '555-123-4567',
    '(555) 987-6543',
    '+1-555-123-4567',
    '5551234567'
  );
  const tokenArb = fc.string({ minLength: 20, maxLength: 100 }).map(
    s => `Bearer ${s}`
  );
  const creditCardArb = fc.constantFrom(
    '4532-1234-5678-9010',
    '4532123456789010',
    '4532 1234 5678 9010'
  );
  const ssnArb = fc.tuple(
    fc.integer({ min: 100, max: 999 }),
    fc.integer({ min: 10, max: 99 }),
    fc.integer({ min: 1000, max: 9999 })
  ).map(([a, b, c]) => `${a}-${b}-${c}`);

  const piiPropertiesArb = fc.record({
    email: fc.option(emailArb, { nil: undefined }),
    phone: fc.option(phoneArb, { nil: undefined }),
    token: fc.option(tokenArb, { nil: undefined }),
    password: fc.option(fc.string(), { nil: undefined }),
    creditCard: fc.option(creditCardArb, { nil: undefined }),
    ssn: fc.option(ssnArb, { nil: undefined }),
  });

  describe('Property 38: Analytics Event Batching', () => {
    /**
     * **Validates: Requirements 23.5**
     * 
     * For any set of analytics events, events should be batched together 
     * before sending to minimize network requests.
     */

    it('should batch any sequence of events up to batch size', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.tuple(eventNameArb, safePropertiesArb),
            { minLength: 1, maxLength: 20 }
          ),
          fc.integer({ min: 1, max: 10 }),
          async (events, batchSize) => {
            // Setup
            (storageService.getBoolean as jest.Mock).mockReturnValue(undefined);
            const service = new AnalyticsService({ 
              debug: false, 
              batchSize,
              flushInterval: 60000 // Long interval to prevent auto-flush
            });
            await service.initialize();

            // Track all events
            for (const [event, properties] of events) {
              await service.trackEvent(event, properties);
            }

            // Verify batching behavior
            const eventBatch = service['eventBatch'];
            
            // If we tracked fewer events than batch size, they should all be in the batch
            if (events.length < batchSize) {
              expect(eventBatch.length).toBe(events.length);
            } else {
              // If we tracked more events than batch size, the batch should have been flushed
              // and only the remainder should be in the batch
              const expectedRemainder = events.length % batchSize;
              expect(eventBatch.length).toBe(expectedRemainder);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should automatically flush when batch reaches configured size', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 2, max: 10 }),
          fc.array(
            fc.tuple(eventNameArb, safePropertiesArb),
            { minLength: 1, maxLength: 5 }
          ),
          async (batchSize, events) => {
            // Setup
            (storageService.getBoolean as jest.Mock).mockReturnValue(undefined);
            const service = new AnalyticsService({ 
              debug: false, 
              batchSize,
              flushInterval: 60000
            });
            await service.initialize();

            const flushSpy = jest.spyOn(service, 'flush');

            // Track events one by one
            for (let i = 0; i < events.length; i++) {
              const [event, properties] = events[i];
              await service.trackEvent(event, properties);

              // Check if flush was called when batch size is reached
              const expectedFlushCount = Math.floor((i + 1) / batchSize);
              expect(flushSpy).toHaveBeenCalledTimes(expectedFlushCount);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should flush all pending events on manual flush', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.tuple(eventNameArb, safePropertiesArb),
            { minLength: 1, maxLength: 15 }
          ),
          fc.integer({ min: 10, max: 20 }), // Batch size larger than event count
          async (events, batchSize) => {
            // Setup
            (storageService.getBoolean as jest.Mock).mockReturnValue(undefined);
            const service = new AnalyticsService({ 
              debug: false, 
              batchSize,
              flushInterval: 60000
            });
            await service.initialize();

            // Track all events (won't auto-flush since batch size is large)
            for (const [event, properties] of events) {
              await service.trackEvent(event, properties);
            }

            // Verify events are in batch
            expect(service['eventBatch'].length).toBe(events.length);

            // Manual flush
            await service.flush();

            // Verify batch is empty after flush
            expect(service['eventBatch'].length).toBe(0);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should flush pending events on timer interval', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.tuple(eventNameArb, safePropertiesArb),
            { minLength: 1, maxLength: 5 }
          ),
          fc.integer({ min: 1000, max: 10000 }),
          async (events, flushInterval) => {
            // Setup
            (storageService.getBoolean as jest.Mock).mockReturnValue(undefined);
            const service = new AnalyticsService({ 
              debug: false, 
              batchSize: 100, // Large batch size to prevent auto-flush
              flushInterval
            });
            await service.initialize();

            // Track events
            for (const [event, properties] of events) {
              await service.trackEvent(event, properties);
            }

            // Verify events are in batch
            expect(service['eventBatch'].length).toBe(events.length);

            // Advance timer to trigger flush
            jest.advanceTimersByTime(flushInterval);

            // Wait for flush to complete
            await Promise.resolve();

            // Verify batch is empty after timer flush
            expect(service['eventBatch'].length).toBe(0);
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should preserve event order in batch', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.tuple(eventNameArb, safePropertiesArb),
            { minLength: 2, maxLength: 10 }
          ),
          async (events) => {
            // Setup
            (storageService.getBoolean as jest.Mock).mockReturnValue(undefined);
            const service = new AnalyticsService({ 
              debug: false, 
              batchSize: 100,
              flushInterval: 60000
            });
            await service.initialize();

            // Track all events
            for (const [event, properties] of events) {
              await service.trackEvent(event, properties);
            }

            // Verify order is preserved
            const eventBatch = service['eventBatch'];
            for (let i = 0; i < events.length; i++) {
              expect(eventBatch[i].event).toBe(events[i][0]);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 39: PII Not in Analytics', () => {
    /**
     * **Validates: Requirements 23.7**
     * 
     * For any analytics event payload, the content should not contain 
     * personally identifiable information (email, phone, full name, address).
     */

    it('should filter email addresses from any event properties', async () => {
      await fc.assert(
        fc.asyncProperty(
          eventNameArb,
          fc.record({
            message: fc.string().chain(s => 
              fc.emailAddress().map(email => `${s} ${email}`)
            ),
            userId: fc.uuid(),
          }),
          async (event, properties) => {
            // Setup
            (storageService.getBoolean as jest.Mock).mockReturnValue(undefined);
            const service = new AnalyticsService({ debug: false });
            await service.initialize();

            // Track event with email in properties
            await service.trackEvent(event, properties);

            // Verify email is filtered
            const eventBatch = service['eventBatch'];
            if (eventBatch.length > 0) {
              const trackedEvent = eventBatch[0];
              const stringified = JSON.stringify(trackedEvent.properties);
              
              // Should not contain email pattern
              expect(stringified).toContain('[EMAIL_REDACTED]');
              expect(stringified).not.toMatch(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should filter phone numbers from any event properties', async () => {
      await fc.assert(
        fc.asyncProperty(
          eventNameArb,
          fc.record({
            contact: phoneArb,
            userId: fc.uuid(),
          }),
          async (event, properties) => {
            // Setup
            (storageService.getBoolean as jest.Mock).mockReturnValue(undefined);
            const service = new AnalyticsService({ debug: false });
            await service.initialize();

            // Track event with phone in properties
            await service.trackEvent(event, properties);

            // Verify phone is filtered
            const eventBatch = service['eventBatch'];
            if (eventBatch.length > 0) {
              const trackedEvent = eventBatch[0];
              const stringified = JSON.stringify(trackedEvent.properties);
              
              // Should not contain phone pattern
              expect(stringified).toContain('[PHONE_REDACTED]');
              expect(stringified).not.toMatch(/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should redact sensitive keys from any event properties', async () => {
      await fc.assert(
        fc.asyncProperty(
          eventNameArb,
          piiPropertiesArb,
          async (event, properties) => {
            // Setup
            (storageService.getBoolean as jest.Mock).mockReturnValue(undefined);
            const service = new AnalyticsService({ debug: false });
            await service.initialize();

            // Track event with sensitive keys
            await service.trackEvent(event, properties);

            // Verify sensitive keys are redacted
            const eventBatch = service['eventBatch'];
            if (eventBatch.length > 0) {
              const trackedEvent = eventBatch[0];
              
              // Check each sensitive key
              if (properties.password !== undefined) {
                expect(trackedEvent.properties.password).toBe('[REDACTED]');
              }
              if (properties.token !== undefined) {
                expect(trackedEvent.properties.token).toBe('[REDACTED]');
              }
              if (properties.email !== undefined) {
                expect(trackedEvent.properties.email).toBe('[REDACTED]');
              }
              if (properties.phone !== undefined) {
                expect(trackedEvent.properties.phone).toBe('[REDACTED]');
              }
              if (properties.creditCard !== undefined) {
                expect(trackedEvent.properties.creditCard).toBe('[REDACTED]');
              }
              if (properties.ssn !== undefined) {
                expect(trackedEvent.properties.ssn).toBe('[REDACTED]');
              }
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should filter credit card numbers from any event properties', async () => {
      await fc.assert(
        fc.asyncProperty(
          eventNameArb,
          fc.record({
            payment: creditCardArb,
            userId: fc.uuid(),
          }),
          async (event, properties) => {
            // Setup
            (storageService.getBoolean as jest.Mock).mockReturnValue(undefined);
            const service = new AnalyticsService({ debug: false });
            await service.initialize();

            // Track event with credit card in properties
            await service.trackEvent(event, properties);

            // Verify credit card is filtered
            const eventBatch = service['eventBatch'];
            if (eventBatch.length > 0) {
              const trackedEvent = eventBatch[0];
              const stringified = JSON.stringify(trackedEvent.properties);
              
              // Should not contain credit card pattern
              expect(stringified).toContain('[CARD_REDACTED]');
              expect(stringified).not.toMatch(/\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should filter SSN from any event properties', async () => {
      await fc.assert(
        fc.asyncProperty(
          eventNameArb,
          fc.record({
            ssn: ssnArb,
            userId: fc.uuid(),
          }),
          async (event, properties) => {
            // Setup
            (storageService.getBoolean as jest.Mock).mockReturnValue(undefined);
            const service = new AnalyticsService({ debug: false });
            await service.initialize();

            // Track event with SSN in properties
            await service.trackEvent(event, properties);

            // Verify SSN is filtered
            const eventBatch = service['eventBatch'];
            if (eventBatch.length > 0) {
              const trackedEvent = eventBatch[0];
              const stringified = JSON.stringify(trackedEvent.properties);
              
              // Should not contain SSN pattern
              expect(stringified).toContain('[SSN_REDACTED]');
              expect(stringified).not.toMatch(/\d{3}-\d{2}-\d{4}/);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should validate no PII remains after filtering', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            normalField: safeStringArb,
            email: fc.option(emailArb, { nil: undefined }),
            phone: fc.option(phoneArb, { nil: undefined }),
            token: fc.option(tokenArb, { nil: undefined }),
          }),
          async (properties) => {
            // Filter the properties
            const filtered = filterPIIFromProperties(properties);

            // Validate no PII remains
            const isValid = validateNoPII(filtered);

            // Should always be valid after filtering
            expect(isValid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve safe properties while filtering PII', async () => {
      await fc.assert(
        fc.asyncProperty(
          eventNameArb,
          fc.record({
            userId: fc.uuid(),
            screenName: safeStringArb,
            count: fc.integer({ min: 0, max: 1000 }),
            isActive: fc.boolean(),
            email: emailArb, // PII that should be filtered
          }),
          async (event, properties) => {
            // Setup
            (storageService.getBoolean as jest.Mock).mockReturnValue(undefined);
            const service = new AnalyticsService({ debug: false });
            await service.initialize();

            // Track event
            await service.trackEvent(event, properties);

            // Verify safe properties are preserved
            const eventBatch = service['eventBatch'];
            if (eventBatch.length > 0) {
              const trackedEvent = eventBatch[0];
              
              // Safe properties should be preserved
              expect(trackedEvent.properties.userId).toBe(properties.userId);
              expect(trackedEvent.properties.screenName).toBe(properties.screenName);
              expect(trackedEvent.properties.count).toBe(properties.count);
              expect(trackedEvent.properties.isActive).toBe(properties.isActive);
              
              // PII should be filtered
              expect(trackedEvent.properties.email).toBe('[REDACTED]');
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should block events that contain PII after filtering', async () => {
      await fc.assert(
        fc.asyncProperty(
          eventNameArb,
          async (event) => {
            // Setup
            (storageService.getBoolean as jest.Mock).mockReturnValue(undefined);
            const service = new AnalyticsService({ debug: false });
            await service.initialize();

            // Create properties with PII that somehow bypasses filtering
            // (This is a defensive test - in practice, filtering should catch everything)
            const maliciousProperties = {
              // Use a pattern that might bypass regex
              data: 'user@example.com',
            };

            // Mock validateNoPII to simulate PII detection
            const originalValidate = validateNoPII;
            jest.spyOn(require('./pii-filter'), 'validateNoPII').mockReturnValue(false);

            // Track event
            await service.trackEvent(event, maliciousProperties);

            // Event should be blocked (not added to batch)
            const eventBatch = service['eventBatch'];
            expect(eventBatch.length).toBe(0);

            // Restore original function
            jest.spyOn(require('./pii-filter'), 'validateNoPII').mockImplementation(originalValidate);
          }
        ),
        { numRuns: 30 }
      );
    });
  });
});
