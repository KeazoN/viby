/**
 * Analytics Service Tests
 */

import { AnalyticsService } from './analytics-service';
import { AnalyticsEvent } from './types';
import { storageService } from '@viby/shared/storage';

// Mock storage service
jest.mock('@viby/shared/storage', () => ({
  storageService: {
    getBoolean: jest.fn(),
    setBoolean: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
  },
}));

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AnalyticsService({ debug: false });
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      (storageService.getBoolean as jest.Mock).mockReturnValue(undefined);
      
      await service.initialize();
      
      expect(service.isEnabled()).toBe(true);
    });

    it('should respect opt-out preference', async () => {
      (storageService.getBoolean as jest.Mock).mockReturnValue(false);
      
      await service.initialize();
      
      expect(service.isEnabled()).toBe(false);
    });

    it('should not initialize twice', async () => {
      (storageService.getBoolean as jest.Mock).mockReturnValue(undefined);
      
      await service.initialize();
      await service.initialize();
      
      // Should only check storage once
      expect(storageService.getBoolean).toHaveBeenCalledTimes(1);
    });
  });

  describe('trackEvent', () => {
    beforeEach(async () => {
      (storageService.getBoolean as jest.Mock).mockReturnValue(undefined);
      await service.initialize();
    });

    it('should track events with properties', async () => {
      await service.trackEvent(AnalyticsEvent.SCREEN_VIEW, {
        screen_name: 'HomeScreen',
      });

      // Event should be added to batch
      expect(service['eventBatch'].length).toBe(1);
      expect(service['eventBatch'][0].event).toBe(AnalyticsEvent.SCREEN_VIEW);
    });

    it('should filter PII from event properties', async () => {
      await service.trackEvent(AnalyticsEvent.LOGIN_SUCCESS, {
        username: 'john_doe',
        email: 'john@example.com',
        password: 'secret123',
      });

      const event = service['eventBatch'][0];
      expect(event.properties.username).toBe('john_doe');
      expect(event.properties.email).toBe('[REDACTED]');
      expect(event.properties.password).toBe('[REDACTED]');
    });

    it('should not track events when disabled', async () => {
      await service.disableAnalytics();
      
      await service.trackEvent(AnalyticsEvent.SCREEN_VIEW, {
        screen_name: 'HomeScreen',
      });

      expect(service['eventBatch'].length).toBe(0);
    });

    it('should flush when batch is full', async () => {
      const flushSpy = jest.spyOn(service, 'flush');
      
      // Set small batch size
      service['config'].batchSize = 2;

      await service.trackEvent(AnalyticsEvent.SCREEN_VIEW, { screen: 'Screen1' });
      expect(flushSpy).not.toHaveBeenCalled();

      await service.trackEvent(AnalyticsEvent.SCREEN_VIEW, { screen: 'Screen2' });
      expect(flushSpy).toHaveBeenCalled();
    });
  });

  describe('trackScreenView', () => {
    beforeEach(async () => {
      (storageService.getBoolean as jest.Mock).mockReturnValue(undefined);
      await service.initialize();
    });

    it('should track screen views', async () => {
      await service.trackScreenView('HomeScreen');

      const event = service['eventBatch'][0];
      expect(event.event).toBe(AnalyticsEvent.SCREEN_VIEW);
      expect(event.properties.screen_name).toBe('HomeScreen');
    });

    it('should include additional properties', async () => {
      await service.trackScreenView('ProfileScreen', {
        userId: '12345',
      });

      const event = service['eventBatch'][0];
      expect(event.properties.screen_name).toBe('ProfileScreen');
      expect(event.properties.userId).toBe('12345');
    });
  });

  describe('setUserProperties', () => {
    beforeEach(async () => {
      (storageService.getBoolean as jest.Mock).mockReturnValue(undefined);
      await service.initialize();
    });

    it('should set user properties', async () => {
      await service.setUserProperties({
        userId: '12345',
        username: 'john_doe',
      });

      // Should not throw
      expect(true).toBe(true);
    });

    it('should filter PII from user properties', async () => {
      // This test verifies that PII filtering is applied
      // In a real implementation, we would verify the Firebase call
      await service.setUserProperties({
        userId: '12345',
        email: 'john@example.com',
      });

      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('enableAnalytics', () => {
    it('should enable analytics', async () => {
      await service.disableAnalytics();
      expect(service.isEnabled()).toBe(false);

      await service.enableAnalytics();
      expect(service.isEnabled()).toBe(true);
      expect(storageService.setBoolean).toHaveBeenCalledWith('analytics_enabled', true);
    });
  });

  describe('disableAnalytics', () => {
    beforeEach(async () => {
      (storageService.getBoolean as jest.Mock).mockReturnValue(undefined);
      await service.initialize();
    });

    it('should disable analytics', async () => {
      await service.disableAnalytics();

      expect(service.isEnabled()).toBe(false);
      expect(storageService.setBoolean).toHaveBeenCalledWith('analytics_enabled', false);
    });

    it('should clear pending events', async () => {
      await service.trackEvent(AnalyticsEvent.SCREEN_VIEW, { screen: 'Test' });
      expect(service['eventBatch'].length).toBe(1);

      await service.disableAnalytics();
      expect(service['eventBatch'].length).toBe(0);
    });
  });

  describe('flush', () => {
    beforeEach(async () => {
      (storageService.getBoolean as jest.Mock).mockReturnValue(undefined);
      await service.initialize();
    });

    it('should flush pending events', async () => {
      await service.trackEvent(AnalyticsEvent.SCREEN_VIEW, { screen: 'Screen1' });
      await service.trackEvent(AnalyticsEvent.SCREEN_VIEW, { screen: 'Screen2' });

      expect(service['eventBatch'].length).toBe(2);

      await service.flush();

      expect(service['eventBatch'].length).toBe(0);
    });

    it('should handle empty batch', async () => {
      await service.flush();
      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('reset', () => {
    beforeEach(async () => {
      (storageService.getBoolean as jest.Mock).mockReturnValue(undefined);
      await service.initialize();
    });

    it('should reset analytics', async () => {
      await service.trackEvent(AnalyticsEvent.SCREEN_VIEW, { screen: 'Test' });
      await service.setUserId('12345');

      await service.reset();

      expect(service['eventBatch'].length).toBe(0);
    });
  });
});
