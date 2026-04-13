/**
 * Tests for Reporting Service
 * 
 * Requirements: 24.6
 */

import { ReportingService, ReportReason } from './reporting-service';
import { httpClient } from '@viby/shared/networking';
import { analyticsTracker } from '@viby/shared/analytics';

// Mock dependencies
jest.mock('@viby/shared/networking');
jest.mock('@viby/shared/analytics');

describe('ReportingService', () => {
  let reportingService: ReportingService;

  beforeEach(() => {
    reportingService = new ReportingService();
    jest.clearAllMocks();
  });

  describe('reportUser', () => {
    it('should submit a user report successfully', async () => {
      const mockResponse = {
        reportId: 'report-123',
        status: 'submitted' as const,
        message: 'Report submitted successfully',
      };

      (httpClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const reportData = {
        reportedUserId: 'user-456',
        reason: ReportReason.HARASSMENT,
        description: 'User was being abusive',
        roomId: 'room-789',
      };

      const result = await reportingService.reportUser(reportData);

      expect(httpClient.post).toHaveBeenCalledWith('/reports/users', {
        reportedUserId: 'user-456',
        reason: ReportReason.HARASSMENT,
        description: 'User was being abusive',
        roomId: 'room-789',
        messageId: undefined,
      });

      expect(result).toEqual(mockResponse);
      expect(analyticsTracker.engagement.trackEvent).toHaveBeenCalledWith(
        'user_reported',
        expect.objectContaining({
          reason: ReportReason.HARASSMENT,
          hasDescription: true,
          hasRoomId: true,
        })
      );
    });

    it('should throw error if reported user ID is missing', async () => {
      await expect(
        reportingService.reportUser({
          reportedUserId: '',
          reason: ReportReason.SPAM,
        })
      ).rejects.toThrow('Reported user ID is required');
    });

    it('should throw error if reason is missing', async () => {
      await expect(
        reportingService.reportUser({
          reportedUserId: 'user-123',
          reason: '' as any,
        })
      ).rejects.toThrow('Report reason is required');
    });

    it('should handle API errors', async () => {
      (httpClient.post as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      await expect(
        reportingService.reportUser({
          reportedUserId: 'user-123',
          reason: ReportReason.SPAM,
        })
      ).rejects.toThrow('Network error');
    });
  });

  describe('reportMessage', () => {
    it('should submit a message report successfully', async () => {
      const mockResponse = {
        reportId: 'report-456',
        status: 'under_review' as const,
        message: 'Message report submitted',
      };

      (httpClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await reportingService.reportMessage(
        'message-123',
        'room-456',
        ReportReason.INAPPROPRIATE_CONTENT,
        'Offensive language'
      );

      expect(httpClient.post).toHaveBeenCalledWith('/reports/messages', {
        messageId: 'message-123',
        roomId: 'room-456',
        reason: ReportReason.INAPPROPRIATE_CONTENT,
        description: 'Offensive language',
      });

      expect(result).toEqual(mockResponse);
      expect(analyticsTracker.engagement.trackEvent).toHaveBeenCalledWith(
        'message_reported',
        expect.objectContaining({
          reason: ReportReason.INAPPROPRIATE_CONTENT,
          hasDescription: true,
        })
      );
    });

    it('should handle message report without description', async () => {
      const mockResponse = {
        reportId: 'report-789',
        status: 'submitted' as const,
        message: 'Report submitted',
      };

      (httpClient.post as jest.Mock).mockResolvedValue(mockResponse);

      await reportingService.reportMessage(
        'message-123',
        'room-456',
        ReportReason.SPAM
      );

      expect(httpClient.post).toHaveBeenCalledWith('/reports/messages', {
        messageId: 'message-123',
        roomId: 'room-456',
        reason: ReportReason.SPAM,
        description: undefined,
      });
    });
  });

  describe('blockUser', () => {
    it('should block a user successfully', async () => {
      (httpClient.post as jest.Mock).mockResolvedValue({});

      await reportingService.blockUser('user-123');

      expect(httpClient.post).toHaveBeenCalledWith('/users/block', {
        userId: 'user-123',
      });

      expect(analyticsTracker.engagement.trackEvent).toHaveBeenCalledWith(
        'user_blocked',
        { blockedUserId: 'user-123' }
      );
    });

    it('should throw error if user ID is missing', async () => {
      await expect(reportingService.blockUser('')).rejects.toThrow(
        'User ID is required'
      );
    });
  });

  describe('unblockUser', () => {
    it('should unblock a user successfully', async () => {
      (httpClient.post as jest.Mock).mockResolvedValue({});

      await reportingService.unblockUser('user-123');

      expect(httpClient.post).toHaveBeenCalledWith('/users/unblock', {
        userId: 'user-123',
      });

      expect(analyticsTracker.engagement.trackEvent).toHaveBeenCalledWith(
        'user_unblocked',
        { unblockedUserId: 'user-123' }
      );
    });

    it('should throw error if user ID is missing', async () => {
      await expect(reportingService.unblockUser('')).rejects.toThrow(
        'User ID is required'
      );
    });
  });

  describe('getBlockedUsers', () => {
    it('should get list of blocked users', async () => {
      const mockBlockedUsers = ['user-1', 'user-2', 'user-3'];
      (httpClient.get as jest.Mock).mockResolvedValue({
        blockedUsers: mockBlockedUsers,
      });

      const result = await reportingService.getBlockedUsers();

      expect(httpClient.get).toHaveBeenCalledWith('/users/blocked');
      expect(result).toEqual(mockBlockedUsers);
    });

    it('should handle empty blocked users list', async () => {
      (httpClient.get as jest.Mock).mockResolvedValue({
        blockedUsers: [],
      });

      const result = await reportingService.getBlockedUsers();

      expect(result).toEqual([]);
    });
  });
});
