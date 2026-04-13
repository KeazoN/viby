/**
 * Analytics Tracker Tests
 * 
 * Tests for centralized analytics tracking
 */

import { analyticsService } from './analytics-service';
import {
  EngagementTracker,
  PerformanceTracker,
  ErrorTracker,
  RetentionTracker,
} from './analytics-tracker';
import { AnalyticsEvent } from './types';

// Mock analytics service
jest.mock('./analytics-service', () => ({
  analyticsService: {
    trackEvent: jest.fn(),
    trackScreenView: jest.fn(),
  },
}));

describe('EngagementTracker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should track screen view', () => {
    EngagementTracker.trackScreenView('HomeScreen', { previous_screen: 'WelcomeScreen' });

    expect(analyticsService.trackScreenView).toHaveBeenCalledWith('HomeScreen', {
      timestamp: expect.any(Number),
      previous_screen: 'WelcomeScreen',
    });
  });

  it('should track match request', () => {
    EngagementTracker.trackMatchRequest('track_123', 5);

    expect(analyticsService.trackEvent).toHaveBeenCalledWith(AnalyticsEvent.MATCH_REQUEST, {
      track_id: 'track_123',
      listener_count: 5,
      timestamp: expect.any(Number),
    });
  });

  it('should track match accept', () => {
    EngagementTracker.trackMatchAccept('match_123', 'opponent_456');

    expect(analyticsService.trackEvent).toHaveBeenCalledWith(AnalyticsEvent.MATCH_ACCEPTED, {
      match_id: 'match_123',
      opponent_id: 'opponent_456',
      timestamp: expect.any(Number),
    });
  });

  it('should track match decline', () => {
    EngagementTracker.trackMatchDecline('match_123', 'not_interested');

    expect(analyticsService.trackEvent).toHaveBeenCalledWith(AnalyticsEvent.MATCH_DECLINED, {
      match_id: 'match_123',
      reason: 'not_interested',
      timestamp: expect.any(Number),
    });
  });

  it('should track game start', () => {
    EngagementTracker.trackGameStart('game_123', 'opponent_456');

    expect(analyticsService.trackEvent).toHaveBeenCalledWith(AnalyticsEvent.GAME_STARTED, {
      game_id: 'game_123',
      opponent_id: 'opponent_456',
      timestamp: expect.any(Number),
    });
  });

  it('should track game complete', () => {
    EngagementTracker.trackGameComplete('game_123', 120000, 5, 3, 'me');

    expect(analyticsService.trackEvent).toHaveBeenCalledWith(AnalyticsEvent.GAME_COMPLETED, {
      game_id: 'game_123',
      duration_ms: 120000,
      my_score: 5,
      opponent_score: 3,
      winner: 'me',
      timestamp: expect.any(Number),
    });
  });

  it('should track message sent', () => {
    EngagementTracker.trackMessageSent('room_123', 50);

    expect(analyticsService.trackEvent).toHaveBeenCalledWith(AnalyticsEvent.MESSAGE_SENT, {
      room_id: 'room_123',
      message_length: 50,
      timestamp: expect.any(Number),
    });
  });

  it('should track currently playing update', () => {
    EngagementTracker.trackCurrentlyPlayingUpdate('track_123', 'Song Name');

    expect(analyticsService.trackEvent).toHaveBeenCalledWith(
      AnalyticsEvent.CURRENTLY_PLAYING_UPDATED,
      {
        track_id: 'track_123',
        track_name: 'Song Name',
        timestamp: expect.any(Number),
      }
    );
  });
});

describe('PerformanceTracker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should track app launch', () => {
    PerformanceTracker.trackAppLaunch(1500);

    expect(analyticsService.trackEvent).toHaveBeenCalledWith(AnalyticsEvent.APP_LAUNCH, {
      launch_time_ms: 1500,
      timestamp: expect.any(Number),
    });
  });

  it('should track screen transition', () => {
    PerformanceTracker.startScreenTransition('HomeScreen', 'ProfileScreen');
    
    // Simulate some time passing
    jest.advanceTimersByTime(300);
    
    PerformanceTracker.completeScreenTransition('HomeScreen', 'ProfileScreen');

    expect(analyticsService.trackEvent).toHaveBeenCalledWith(AnalyticsEvent.SCREEN_TRANSITION, {
      from_screen: 'HomeScreen',
      to_screen: 'ProfileScreen',
      transition_time_ms: expect.any(Number),
      timestamp: expect.any(Number),
    });
  });

  it('should track WebSocket latency', () => {
    PerformanceTracker.trackWebSocketLatency(50);

    expect(analyticsService.trackEvent).toHaveBeenCalledWith(AnalyticsEvent.WEBSOCKET_CONNECTED, {
      latency_ms: 50,
      timestamp: expect.any(Number),
    });
  });
});

describe('ErrorTracker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should track WebSocket disconnection', () => {
    ErrorTracker.trackWebSocketDisconnection('transport close', 60000);

    expect(analyticsService.trackEvent).toHaveBeenCalledWith(
      AnalyticsEvent.WEBSOCKET_DISCONNECTED,
      {
        reason: 'transport close',
        connection_duration_ms: 60000,
        timestamp: expect.any(Number),
      }
    );
  });

  it('should track WebSocket error', () => {
    ErrorTracker.trackWebSocketError('connect_error', 'Connection timeout');

    expect(analyticsService.trackEvent).toHaveBeenCalledWith(AnalyticsEvent.WEBSOCKET_ERROR, {
      error_type: 'connect_error',
      error_message: 'Connection timeout',
      timestamp: expect.any(Number),
    });
  });

  it('should track crash', () => {
    ErrorTracker.trackCrash('Uncaught exception', 'Error stack trace');

    expect(analyticsService.trackEvent).toHaveBeenCalledWith(AnalyticsEvent.CRASH, {
      error_message: 'Uncaught exception',
      error_stack: 'Error stack trace',
      timestamp: expect.any(Number),
    });
  });

  it('should track general error', () => {
    ErrorTracker.trackError('api_error', 'Request failed', 'ProfileScreen');

    expect(analyticsService.trackEvent).toHaveBeenCalledWith(AnalyticsEvent.ERROR_OCCURRED, {
      error_type: 'api_error',
      error_message: 'Request failed',
      context: 'ProfileScreen',
      timestamp: expect.any(Number),
    });
  });
});

describe('RetentionTracker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should start session', () => {
    RetentionTracker.startSession();

    expect(analyticsService.trackEvent).toHaveBeenCalledWith(AnalyticsEvent.APP_FOREGROUND, {
      timestamp: expect.any(Number),
    });
  });

  it('should end session', () => {
    RetentionTracker.startSession();
    
    // Simulate some time passing
    jest.advanceTimersByTime(120000);
    
    RetentionTracker.endSession();

    expect(analyticsService.trackEvent).toHaveBeenCalledWith(AnalyticsEvent.APP_BACKGROUND, {
      session_duration_ms: expect.any(Number),
      timestamp: expect.any(Number),
    });
  });

  it('should track feature adoption', () => {
    RetentionTracker.trackFeatureAdoption('chat', true);

    expect(analyticsService.trackEvent).toHaveBeenCalledWith('feature_chat', {
      feature_name: 'chat',
      is_first_use: true,
      timestamp: expect.any(Number),
    });
  });

  it('should track daily active user', () => {
    const today = new Date().toISOString().split('T')[0];
    
    RetentionTracker.trackDailyActive();

    expect(analyticsService.trackEvent).toHaveBeenCalledWith('daily_active_user', {
      date: today,
      timestamp: expect.any(Number),
    });
  });
});
