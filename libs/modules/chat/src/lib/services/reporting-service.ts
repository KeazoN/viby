/**
 * Reporting Service
 * 
 * Handles user reporting functionality for inappropriate behavior.
 * Allows users to report other users for violations of community guidelines.
 * 
 * Requirements: 24.6
 */

import { httpClient } from '@viby/shared/networking';
import { analyticsTracker } from '@viby/shared/analytics';

/**
 * Reasons for reporting a user
 */
export enum ReportReason {
  HARASSMENT = 'harassment',
  INAPPROPRIATE_CONTENT = 'inappropriate_content',
  SPAM = 'spam',
  HATE_SPEECH = 'hate_speech',
  IMPERSONATION = 'impersonation',
  OTHER = 'other',
}

/**
 * Report submission data
 */
export interface ReportData {
  reportedUserId: string;
  reason: ReportReason;
  description?: string;
  roomId?: string;
  messageId?: string;
}

/**
 * Report submission response
 */
export interface ReportResponse {
  reportId: string;
  status: 'submitted' | 'under_review';
  message: string;
}

/**
 * ReportingService handles user reporting functionality
 */
export class ReportingService {
  /**
   * Submit a report for a user
   * @param data - Report data including user ID, reason, and optional details
   * @returns Promise resolving to the report response
   * 
   * Provide user reporting functionality for inappropriate behavior
   */
  async reportUser(data: ReportData): Promise<ReportResponse> {
    try {
      // Validate report data
      if (!data.reportedUserId) {
        throw new Error('Reported user ID is required');
      }

      if (!data.reason) {
        throw new Error('Report reason is required');
      }

      // Submit report to backend
      const response = await httpClient.post<ReportResponse>(
        '/reports/users',
        {
          reportedUserId: data.reportedUserId,
          reason: data.reason,
          description: data.description,
          roomId: data.roomId,
          messageId: data.messageId,
        }
      );

      // Track report submission
      analyticsTracker.engagement.trackEvent('user_reported', {
        reason: data.reason,
        hasDescription: !!data.description,
        hasRoomId: !!data.roomId,
        hasMessageId: !!data.messageId,
      });

      return response;
    } catch (error) {
      console.error('Failed to submit report:', error);
      throw error;
    }
  }

  /**
   * Report a specific message
   * @param messageId - The message ID to report
   * @param roomId - The room ID where the message was sent
   * @param reason - The reason for reporting
   * @param description - Optional additional details
   * @returns Promise resolving to the report response
   */
  async reportMessage(
    messageId: string,
    roomId: string,
    reason: ReportReason,
    description?: string
  ): Promise<ReportResponse> {
    try {
      const response = await httpClient.post<ReportResponse>(
        '/reports/messages',
        {
          messageId,
          roomId,
          reason,
          description,
        }
      );

      // Track message report
      analyticsTracker.engagement.trackEvent('message_reported', {
        reason,
        hasDescription: !!description,
      });

      return response;
    } catch (error) {
      console.error('Failed to report message:', error);
      throw error;
    }
  }

  /**
   * Block a user (prevents future matches and messages)
   * @param userId - The user ID to block
   * @returns Promise resolving when the user is blocked
   */
  async blockUser(userId: string): Promise<void> {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      await httpClient.post('/users/block', { userId });

      // Track user block
      analyticsTracker.engagement.trackEvent('user_blocked', {
        blockedUserId: userId,
      });
    } catch (error) {
      console.error('Failed to block user:', error);
      throw error;
    }
  }

  /**
   * Unblock a user
   * @param userId - The user ID to unblock
   * @returns Promise resolving when the user is unblocked
   */
  async unblockUser(userId: string): Promise<void> {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      await httpClient.post('/users/unblock', { userId });

      // Track user unblock
      analyticsTracker.engagement.trackEvent('user_unblocked', {
        unblockedUserId: userId,
      });
    } catch (error) {
      console.error('Failed to unblock user:', error);
      throw error;
    }
  }

  /**
   * Get list of blocked users
   * @returns Promise resolving to array of blocked user IDs
   */
  async getBlockedUsers(): Promise<string[]> {
    try {
      const response = await httpClient.get<{ blockedUsers: string[] }>(
        '/users/blocked'
      );
      return response.blockedUsers;
    } catch (error) {
      console.error('Failed to get blocked users:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const reportingService = new ReportingService();
