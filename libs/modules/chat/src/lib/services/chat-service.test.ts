import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ChatService, chatService } from './chat-service';
import { httpClient } from '@viby/shared/networking';
import { socketManager } from '@viby/modules/realtime';
import type {
  MessageReceivedPayload,
  TypingIndicatorPayload,
  ReadReceiptPayload,
  SendMessageResponse,
  LoadHistoryResponse,
  Message,
} from '../types';

// Mock dependencies
vi.mock('@viby/shared/networking', () => ({
  httpClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

vi.mock('@viby/modules/realtime', () => ({
  socketManager: {
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    emit: vi.fn(),
  },
}));

describe('ChatService', () => {
  let service: ChatService;

  beforeEach(() => {
    service = new ChatService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('subscribeToChat', () => {
    it('should subscribe to all chat events', () => {
      const roomId = 'room-123';

      service.subscribeToChat(roomId);

      expect(socketManager.subscribe).toHaveBeenCalledTimes(3);
      expect(socketManager.subscribe).toHaveBeenCalledWith('chat:message', expect.any(Function));
      expect(socketManager.subscribe).toHaveBeenCalledWith('chat:typing', expect.any(Function));
      expect(socketManager.subscribe).toHaveBeenCalledWith('chat:read', expect.any(Function));
    });

    it('should store event handlers for cleanup', () => {
      const roomId = 'room-123';

      service.subscribeToChat(roomId);

      const eventHandlers = (service as any).eventHandlers as Map<string, Function>;

      expect(eventHandlers.size).toBe(3);
      expect(eventHandlers.has(`chat:message:${roomId}`)).toBe(true);
      expect(eventHandlers.has(`chat:typing:${roomId}`)).toBe(true);
      expect(eventHandlers.has(`chat:read:${roomId}`)).toBe(true);
    });

    it('should handle chat:message event for matching roomId', () => {
      const roomId = 'room-123';
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      service.subscribeToChat(roomId);

      const subscribeCall = (socketManager.subscribe as any).mock.calls.find(
        (call: any[]) => call[0] === 'chat:message'
      );
      const handler = subscribeCall[1];

      const payload: MessageReceivedPayload = {
        message: {
          id: 'msg-1',
          roomId,
          userId: 'user-1',
          content: 'Hello!',
          status: 'sent',
          createdAt: new Date().toISOString(),
        },
        timestamp: new Date(),
      };

      handler(payload);

      expect(consoleSpy).toHaveBeenCalledWith('Message received:', payload.message);
      consoleSpy.mockRestore();
    });

    it('should not handle chat:message event for different roomId', () => {
      const roomId = 'room-123';
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      service.subscribeToChat(roomId);

      const subscribeCall = (socketManager.subscribe as any).mock.calls.find(
        (call: any[]) => call[0] === 'chat:message'
      );
      const handler = subscribeCall[1];

      const payload: MessageReceivedPayload = {
        message: {
          id: 'msg-1',
          roomId: 'different-room',
          userId: 'user-1',
          content: 'Hello!',
          status: 'sent',
          createdAt: new Date().toISOString(),
        },
        timestamp: new Date(),
      };

      handler(payload);

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle chat:typing event for matching roomId', () => {
      const roomId = 'room-123';
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      service.subscribeToChat(roomId);

      const subscribeCall = (socketManager.subscribe as any).mock.calls.find(
        (call: any[]) => call[0] === 'chat:typing'
      );
      const handler = subscribeCall[1];

      const payload: TypingIndicatorPayload = {
        roomId,
        userId: 'user-1',
        isTyping: true,
        timestamp: new Date(),
      };

      handler(payload);

      expect(consoleSpy).toHaveBeenCalledWith('Typing indicator:', payload.userId, payload.isTyping);
      consoleSpy.mockRestore();
    });

    it('should handle chat:read event for matching roomId', () => {
      const roomId = 'room-123';
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      service.subscribeToChat(roomId);

      const subscribeCall = (socketManager.subscribe as any).mock.calls.find(
        (call: any[]) => call[0] === 'chat:read'
      );
      const handler = subscribeCall[1];

      const payload: ReadReceiptPayload = {
        roomId,
        userId: 'user-1',
        messageId: 'msg-1',
        timestamp: new Date(),
      };

      handler(payload);

      expect(consoleSpy).toHaveBeenCalledWith('Read receipt:', payload.userId, payload.messageId);
      consoleSpy.mockRestore();
    });
  });

  describe('unsubscribeFromChat', () => {
    it('should unsubscribe from all chat events', () => {
      const roomId = 'room-123';

      service.subscribeToChat(roomId);
      service.unsubscribeFromChat(roomId);

      expect(socketManager.unsubscribe).toHaveBeenCalledTimes(3);
      expect(socketManager.unsubscribe).toHaveBeenCalledWith('chat:message', expect.any(Function));
      expect(socketManager.unsubscribe).toHaveBeenCalledWith('chat:typing', expect.any(Function));
      expect(socketManager.unsubscribe).toHaveBeenCalledWith('chat:read', expect.any(Function));
    });

    it('should clear event handlers from map', () => {
      const roomId = 'room-123';

      service.subscribeToChat(roomId);
      service.unsubscribeFromChat(roomId);

      const eventHandlers = (service as any).eventHandlers as Map<string, Function>;

      expect(eventHandlers.size).toBe(0);
    });

    it('should handle unsubscribe when no handlers exist', () => {
      const roomId = 'room-123';

      expect(() => service.unsubscribeFromChat(roomId)).not.toThrow();

      expect(socketManager.unsubscribe).not.toHaveBeenCalled();
    });
  });

  describe('sendMessage', () => {
    it('should send message via HTTP client', async () => {
      const roomId = 'room-123';
      const content = 'Hello, world!';

      const mockMessage: Message = {
        id: 'msg-1',
        roomId,
        userId: 'user-1',
        content,
        status: 'sent',
        createdAt: new Date().toISOString(),
      };

      const mockResponse: SendMessageResponse = {
        message: mockMessage,
      };

      (httpClient.post as any).mockResolvedValue(mockResponse);

      const result = await service.sendMessage(roomId, content);

      expect(httpClient.post).toHaveBeenCalledWith(
        `/chat/${roomId}/messages`,
        { content }
      );
      expect(result).toEqual(mockMessage);
    });

    it('should reject messages exceeding 500 characters', async () => {
      const roomId = 'room-123';
      const content = 'a'.repeat(501);

      await expect(service.sendMessage(roomId, content)).rejects.toThrow(
        'Message content exceeds 500 characters'
      );

      expect(httpClient.post).not.toHaveBeenCalled();
    });

    it('should handle send message error', async () => {
      const roomId = 'room-123';
      const content = 'Hello!';
      const error = new Error('Network error');

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      (httpClient.post as any).mockRejectedValue(error);

      await expect(service.sendMessage(roomId, content)).rejects.toThrow('Network error');

      expect(consoleSpy).toHaveBeenCalledWith('Failed to send message:', error);
      consoleSpy.mockRestore();
    });
  });

  describe('loadHistory', () => {
    it('should load message history via HTTP client', async () => {
      const roomId = 'room-123';

      const mockMessages: Message[] = [
        {
          id: 'msg-1',
          roomId,
          userId: 'user-1',
          content: 'Hello!',
          status: 'sent',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'msg-2',
          roomId,
          userId: 'user-2',
          content: 'Hi there!',
          status: 'sent',
          createdAt: new Date().toISOString(),
        },
      ];

      const mockResponse: LoadHistoryResponse = {
        messages: mockMessages,
        hasMore: false,
      };

      (httpClient.get as any).mockResolvedValue(mockResponse);

      const result = await service.loadHistory(roomId);

      expect(httpClient.get).toHaveBeenCalledWith(`/chat/${roomId}/messages`);
      expect(result).toEqual(mockResponse);
    });

    it('should load message history with pagination options', async () => {
      const roomId = 'room-123';
      const options = { limit: 50, offset: 100 };

      const mockResponse: LoadHistoryResponse = {
        messages: [],
        hasMore: true,
      };

      (httpClient.get as any).mockResolvedValue(mockResponse);

      const result = await service.loadHistory(roomId, options);

      expect(httpClient.get).toHaveBeenCalledWith(`/chat/${roomId}/messages?limit=50&offset=100`);
      expect(result).toEqual(mockResponse);
    });

    it('should handle load history error', async () => {
      const roomId = 'room-123';
      const error = new Error('Network error');

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      (httpClient.get as any).mockRejectedValue(error);

      await expect(service.loadHistory(roomId)).rejects.toThrow('Network error');

      expect(consoleSpy).toHaveBeenCalledWith('Failed to load message history:', error);
      consoleSpy.mockRestore();
    });
  });

  describe('sendTypingIndicator', () => {
    it('should send typing indicator via WebSocket', () => {
      const roomId = 'room-123';

      service.sendTypingIndicator(roomId, true);

      expect(socketManager.emit).toHaveBeenCalledWith('chat:typing', {
        roomId,
        isTyping: true,
      });
    });

    it('should default isTyping to true', () => {
      const roomId = 'room-123';

      service.sendTypingIndicator(roomId);

      expect(socketManager.emit).toHaveBeenCalledWith('chat:typing', {
        roomId,
        isTyping: true,
      });
    });

    it('should handle typing indicator error gracefully', () => {
      const roomId = 'room-123';
      const error = new Error('WebSocket error');

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      (socketManager.emit as any).mockImplementation(() => {
        throw error;
      });

      expect(() => service.sendTypingIndicator(roomId)).not.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith('Failed to send typing indicator:', error);
      consoleSpy.mockRestore();
    });
  });

  describe('singleton instance', () => {
    it('should export a singleton instance', () => {
      expect(chatService).toBeInstanceOf(ChatService);
    });
  });
});
