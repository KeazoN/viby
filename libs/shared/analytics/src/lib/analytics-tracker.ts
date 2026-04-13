/**
 * Analytics Tracker
 * 
 * Centralized analytics tracking for user engagement, performance, and retention metrics
 * Implements requirements 23.1, 23.2, 23.3, 23.4
 */

import { analyticsService } from './analytics-service';
import { AnalyticsEvent } from './types';
import type { AnalyticsEventProperties } from './types';

/**
 * Track user engagement events (Requirement 23.1)
 */
export class EngagementTracker {
  /**
   * Track screen view
   */
  static trackScreenView(screenName: string, properties?: AnalyticsEventProperties): void {
    analyticsService.trackScreenView(screenName, {
      timestamp: Date.now(),
      ...properties,
    });
  }

  /**
   * Track match request
   */
  static trackMatchRequest(trackId: string, listenerCount: number): void {
    analyticsService.trackEvent(AnalyticsEvent.MATCH_REQUEST, {
      track_id: trackId,
      listener_count: listenerCount,
      timestamp: Date.now(),
    });
  }

  /**
   * Track match accept
   */
  static trackMatchAccept(matchId: string, opponentId: string): void {
    analyticsService.trackEvent(AnalyticsEvent.MATCH_ACCEPTED, {
      match_id: matchId,
      opponent_id: opponentId,
      timestamp: Date.now(),
    });
  }

  /**
   * Track match decline
   */
  static trackMatchDecline(matchId: string, reason?: string): void {
    analyticsService.trackEvent(AnalyticsEvent.MATCH_DECLINED, {
      match_id: matchId,
      reason: reason || 'user_declined',
      timestamp: Date.now(),
    });
  }

  /**
   * Track game start
   */
  static trackGameStart(gameId: string, opponentId: string): void {
    analyticsService.trackEvent(AnalyticsEvent.GAME_STARTED, {
      game_id: gameId,
      opponent_id: opponentId,
      timestamp: Date.now(),
    });
  }

  /**
   * Track game complete
   */
  static trackGameComplete(
    gameId: string,
    duration: number,
    myScore: number,
    opponentScore: number,
    winner: 'me' | 'opponent' | 'tie'
  ): void {
    analyticsService.trackEvent(AnalyticsEvent.GAME_COMPLETED, {
      game_id: gameId,
      duration_ms: duration,
      my_score: myScore,
      opponent_score: opponentScore,
      winner,
      timestamp: Date.now(),
    });
  }

  /**
   * Track message sent
   */
  static trackMessageSent(roomId: string, messageLength: number): void {
    analyticsService.trackEvent(AnalyticsEvent.MESSAGE_SENT, {
      room_id: roomId,
      message_length: messageLength,
      timestamp: Date.now(),
    });
  }

  /**
   * Track currently playing update
   */
  static trackCurrentlyPlayingUpdate(trackId: string, trackName: string): void {
    analyticsService.trackEvent(AnalyticsEvent.CURRENTLY_PLAYING_UPDATED, {
      track_id: trackId,
      track_name: trackName,
      timestamp: Date.now(),
    });
  }
}

/**
 * Track performance metrics (Requirement 23.2)
 */
export class PerformanceTracker {
  private static screenTransitionStartTime: number | null = null;

  /**
   * Track app launch time
   */
  static trackAppLaunch(launchTime: number): void {
    analyticsService.trackEvent(AnalyticsEvent.APP_LAUNCH, {
      launch_time_ms: launchTime,
      timestamp: Date.now(),
    });
  }

  /**
   * Start tracking screen transition
   */
  static startScreenTransition(fromScreen: string, toScreen: string): void {
    this.screenTransitionStartTime = Date.now();
  }

  /**
   * Complete screen transition tracking
   */
  static completeScreenTransition(fromScreen: string, toScreen: string): void {
    if (this.screenTransitionStartTime) {
      const transitionTime = Date.now() - this.screenTransitionStartTime;
      
      analyticsService.trackEvent(AnalyticsEvent.SCREEN_TRANSITION, {
        from_screen: fromScreen,
        to_screen: toScreen,
        transition_time_ms: transitionTime,
        timestamp: Date.now(),
      });

      this.screenTransitionStartTime = null;
    }
  }

  /**
   * Track WebSocket latency
   */
  static trackWebSocketLatency(latency: number): void {
    analyticsService.trackEvent(AnalyticsEvent.WEBSOCKET_CONNECTED, {
      latency_ms: latency,
      timestamp: Date.now(),
    });
  }
}

/**
 * Track error rates (Requirement 23.3)
 */
export class ErrorTracker {
  /**
   * Track WebSocket disconnection
   */
  static trackWebSocketDisconnection(reason: string, duration: number): void {
    analyticsService.trackEvent(AnalyticsEvent.WEBSOCKET_DISCONNECTED, {
      reason,
      connection_duration_ms: duration,
      timestamp: Date.now(),
    });
  }

  /**
   * Track WebSocket error
   */
  static trackWebSocketError(errorType: string, errorMessage: string): void {
    analyticsService.trackEvent(AnalyticsEvent.WEBSOCKET_ERROR, {
      error_type: errorType,
      error_message: errorMessage,
      timestamp: Date.now(),
    });
  }

  /**
   * Track application crash
   */
  static trackCrash(errorMessage: string, errorStack?: string): void {
    analyticsService.trackEvent(AnalyticsEvent.CRASH, {
      error_message: errorMessage,
      error_stack: errorStack || 'unknown',
      timestamp: Date.now(),
    });
  }

  /**
   * Track general error
   */
  static trackError(errorType: string, errorMessage: string, context?: string): void {
    analyticsService.trackEvent(AnalyticsEvent.ERROR_OCCURRED, {
      error_type: errorType,
      error_message: errorMessage,
      context: context || 'unknown',
      timestamp: Date.now(),
    });
  }
}

/**
 * Track retention metrics (Requirement 23.4)
 */
export class RetentionTracker {
  private static sessionStartTime: number | null = null;

  /**
   * Start tracking session
   */
  static startSession(): void {
    this.sessionStartTime = Date.now();
    
    analyticsService.trackEvent(AnalyticsEvent.APP_FOREGROUND, {
      timestamp: Date.now(),
    });
  }

  /**
   * End tracking session
   */
  static endSession(): void {
    if (this.sessionStartTime) {
      const sessionDuration = Date.now() - this.sessionStartTime;
      
      analyticsService.trackEvent(AnalyticsEvent.APP_BACKGROUND, {
        session_duration_ms: sessionDuration,
        timestamp: Date.now(),
      });

      this.sessionStartTime = null;
    }
  }

  /**
   * Track feature adoption
   */
  static trackFeatureAdoption(featureName: string, isFirstUse: boolean): void {
    analyticsService.trackEvent(`feature_${featureName}`, {
      feature_name: featureName,
      is_first_use: isFirstUse,
      timestamp: Date.now(),
    });
  }

  /**
   * Track daily active user
   */
  static trackDailyActive(): void {
    const today = new Date().toISOString().split('T')[0];
    
    analyticsService.trackEvent('daily_active_user', {
      date: today,
      timestamp: Date.now(),
    });
  }
}

/**
 * Unified analytics tracker
 */
export const analyticsTracker = {
  engagement: EngagementTracker,
  performance: PerformanceTracker,
  error: ErrorTracker,
  retention: RetentionTracker,
};
