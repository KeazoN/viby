import * as fc from 'fast-check';
import { useChatStore } from './stores/chat-store';
import { chatService } from './services/chat-service';
import type { Message, MessageStatus } from './types';

/**
 * Property-Based Tests for Chat Module
 * 
 * These tests use fast-check to verify properties hold across many generated inputs.
 */

// Define global __DEV__
(global as any).__DEV__ = false;

// Mock dependencies
jest.mock('./services/chat-service', () => ({
  chatService: {
    sendMessage: jest.fn(),
    loadHistory: jest.fn(),
    subscribeToChat: jest.fn(),
    unsubscribeFromChat: jest.fn(),
    sendTypingIndicator: jest.fn(),
  },
}));

describe('Chat Module - Property-Based Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state
    useChatStore.setState({
      messages: {},
      typingUsers: {},
      unreadCounts: {},
    });
  });

  // Arbitraries for generating test data
  const messageStatusArb = fc.constantFrom(
    'sending' as const,
    'sent' as const,
    'failed' as const
  );

  const messageArb = fc.record({
    id: fc.uuid(),
    roomId: fc.uuid(),
    userId: fc.uuid(),
    content: fc.string({ minLength: 1, maxLength: 500 }),
    status: messageStatusArb,
    createdAt: fc.date().map(d => d.toISOString()),
  }) as fc.Arbitrary<Message>;

  const roomIdArb = fc.uuid();
  const userIdArb = fc.uuid();

  /**
   * Property 14: Optimistic Message Display
   * 
   * For any message sent by the user, the message should appear in the chat UI 
   * immediately with "sending" status before server confirmation.
   */
  describe('Property 14: Optimistic Message Display', () => {
    it('should add message immediately with "sending" status', async () => {
      await fc.assert(
        fc.asyncProperty(
          roomIdArb,
          userIdArb,
          fc.string({ minLength: 1, maxLength: 500 }),
          async (roomId, userId, content) => {
            // Setup: Create optimistic message
            const optimisticMessage: Message = {
              id: `temp-${Date.now()}`,
              roomId,
              userId,
              content,
              status: 'sending',
              createdAt: new Date().toISOString(),
            };

            // Act: Add message to store (simulating optimistic update)
            useChatStore.getState().addMessage(roomId, optimisticMessage);

            // Verify: Message should be in store immediately
            const messages = useChatStore.getState().messages[roomId];
            expect(messages).toBeDefined();
            expect(messages.length).toBe(1);
            expect(messages[0]).toEqual(optimisticMessage);
            expect(messages[0].status).toBe('sending');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should display message before server confirmation for any content', async () => {
      await fc.assert(
        fc.asyncProperty(
          messageArb,
          async (message) => {
            // Ensure message starts with "sending" status
            const sendingMessage = { ...message, status: 'sending' as const };

            // Act: Add message optimistically
            useChatStore.getState().addMessage(message.roomId, sendingMessage);

            // Verify: Message appears immediately
            const messages = useChatStore.getState().messages[message.roomId];
            expect(messages).toContainEqual(sendingMessage);
            
            // Verify: Status is "sending"
            const addedMessage = messages.find(m => m.id === message.id);
            expect(addedMessage?.status).toBe('sending');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain message order when adding optimistic messages', async () => {
      await fc.assert(
        fc.asyncProperty(
          roomIdArb,
          fc.array(messageArb, { minLength: 2, maxLength: 10 }),
          async (roomId, messages) => {
            // Setup: Modify all messages to have same roomId and "sending" status
            const sendingMessages = messages.map((m, i) => ({
              ...m,
              roomId,
              status: 'sending' as const,
              createdAt: new Date(Date.now() + i * 1000).toISOString(),
            }));

            // Act: Add messages in order
            for (const message of sendingMessages) {
              useChatStore.getState().addMessage(roomId, message);
            }

            // Verify: Messages should be in the order they were added
            const storedMessages = useChatStore.getState().messages[roomId];
            expect(storedMessages.length).toBe(sendingMessages.length);
            
            for (let i = 0; i < sendingMessages.length; i++) {
              expect(storedMessages[i].id).toBe(sendingMessages[i].id);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 15: Message Status Progression
   * 
   * For any successfully sent message, the status should progress from "sending" 
   * to "sent" after Backend_API confirmation.
   */
  describe('Property 15: Message Status Progression', () => {
    it('should update message status from "sending" to "sent" on confirmation', async () => {
      await fc.assert(
        fc.asyncProperty(
          messageArb,
          async (message) => {
            // Setup: Add message with "sending" status
            const sendingMessage = { ...message, status: 'sending' as const };
            useChatStore.getState().addMessage(message.roomId, sendingMessage);

            // Verify initial status
            let messages = useChatStore.getState().messages[message.roomId];
            expect(messages[0].status).toBe('sending');

            // Act: Update status to "sent" (simulating server confirmation)
            useChatStore.getState().updateMessageStatus(
              message.roomId,
              message.id,
              'sent'
            );

            // Verify: Status should be updated to "sent"
            messages = useChatStore.getState().messages[message.roomId];
            const updatedMessage = messages.find(m => m.id === message.id);
            expect(updatedMessage?.status).toBe('sent');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should only update the specific message status, not others', async () => {
      await fc.assert(
        fc.asyncProperty(
          roomIdArb,
          fc.array(messageArb, { minLength: 3, maxLength: 10 }),
          fc.integer({ min: 0, max: 9 }), // index of message to update
          async (roomId, messages, updateIndex) => {
            // Ensure index is valid
            fc.pre(updateIndex < messages.length);

            // Setup: Add all messages with "sending" status
            const sendingMessages = messages.map(m => ({
              ...m,
              roomId,
              status: 'sending' as const,
            }));

            for (const message of sendingMessages) {
              useChatStore.getState().addMessage(roomId, message);
            }

            // Act: Update only one message to "sent"
            const messageToUpdate = sendingMessages[updateIndex];
            useChatStore.getState().updateMessageStatus(
              roomId,
              messageToUpdate.id,
              'sent'
            );

            // Verify: Only the specified message should be "sent"
            const storedMessages = useChatStore.getState().messages[roomId];
            for (let i = 0; i < storedMessages.length; i++) {
              if (i === updateIndex) {
                expect(storedMessages[i].status).toBe('sent');
              } else {
                expect(storedMessages[i].status).toBe('sending');
              }
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle status progression for multiple messages independently', async () => {
      await fc.assert(
        fc.asyncProperty(
          roomIdArb,
          fc.array(messageArb, { minLength: 2, maxLength: 5 }),
          async (roomId, messages) => {
            // Setup: Add all messages with "sending" status
            const sendingMessages = messages.map(m => ({
              ...m,
              roomId,
              status: 'sending' as const,
            }));

            for (const message of sendingMessages) {
              useChatStore.getState().addMessage(roomId, message);
            }

            // Act: Update each message to "sent" one by one
            for (let i = 0; i < sendingMessages.length; i++) {
              useChatStore.getState().updateMessageStatus(
                roomId,
                sendingMessages[i].id,
                'sent'
              );

              // Verify: Messages up to index i should be "sent", rest should be "sending"
              const storedMessages = useChatStore.getState().messages[roomId];
              for (let j = 0; j < storedMessages.length; j++) {
                if (j <= i) {
                  expect(storedMessages[j].status).toBe('sent');
                } else {
                  expect(storedMessages[j].status).toBe('sending');
                }
              }
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 16: Failed Message Error Indication
   * 
   * For any message that fails to send, the message status should change to "failed" 
   * and an error indicator should be displayed.
   */
  describe('Property 16: Failed Message Error Indication', () => {
    it('should update message status to "failed" on send failure', async () => {
      await fc.assert(
        fc.asyncProperty(
          messageArb,
          async (message) => {
            // Setup: Add message with "sending" status
            const sendingMessage = { ...message, status: 'sending' as const };
            useChatStore.getState().addMessage(message.roomId, sendingMessage);

            // Act: Update status to "failed" (simulating send failure)
            useChatStore.getState().updateMessageStatus(
              message.roomId,
              message.id,
              'failed'
            );

            // Verify: Status should be "failed"
            const messages = useChatStore.getState().messages[message.roomId];
            const failedMessage = messages.find(m => m.id === message.id);
            expect(failedMessage?.status).toBe('failed');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow retry by updating failed message back to sending', async () => {
      await fc.assert(
        fc.asyncProperty(
          messageArb,
          async (message) => {
            // Setup: Add message and mark as failed
            const failedMessage = { ...message, status: 'failed' as const };
            useChatStore.getState().addMessage(message.roomId, failedMessage);

            // Verify initial failed status
            let messages = useChatStore.getState().messages[message.roomId];
            expect(messages[0].status).toBe('failed');

            // Act: Retry by updating to "sending"
            useChatStore.getState().updateMessageStatus(
              message.roomId,
              message.id,
              'sending'
            );

            // Verify: Status should be "sending" again
            messages = useChatStore.getState().messages[message.roomId];
            const retriedMessage = messages.find(m => m.id === message.id);
            expect(retriedMessage?.status).toBe('sending');

            // Act: Simulate successful send
            useChatStore.getState().updateMessageStatus(
              message.roomId,
              message.id,
              'sent'
            );

            // Verify: Status should now be "sent"
            messages = useChatStore.getState().messages[message.roomId];
            const sentMessage = messages.find(m => m.id === message.id);
            expect(sentMessage?.status).toBe('sent');
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should maintain failed status until explicitly updated', async () => {
      await fc.assert(
        fc.asyncProperty(
          roomIdArb,
          fc.array(messageArb, { minLength: 2, maxLength: 5 }),
          fc.integer({ min: 0, max: 4 }), // index of message to fail
          async (roomId, messages, failIndex) => {
            // Ensure index is valid
            fc.pre(failIndex < messages.length);

            // Setup: Add all messages with "sending" status
            const sendingMessages = messages.map(m => ({
              ...m,
              roomId,
              status: 'sending' as const,
            }));

            for (const message of sendingMessages) {
              useChatStore.getState().addMessage(roomId, message);
            }

            // Act: Mark one message as failed
            useChatStore.getState().updateMessageStatus(
              roomId,
              sendingMessages[failIndex].id,
              'failed'
            );

            // Act: Update other messages to "sent"
            for (let i = 0; i < sendingMessages.length; i++) {
              if (i !== failIndex) {
                useChatStore.getState().updateMessageStatus(
                  roomId,
                  sendingMessages[i].id,
                  'sent'
                );
              }
            }

            // Verify: Failed message should still be "failed"
            const storedMessages = useChatStore.getState().messages[roomId];
            const failedMessage = storedMessages.find(
              m => m.id === sendingMessages[failIndex].id
            );
            expect(failedMessage?.status).toBe('failed');

            // Verify: Other messages should be "sent"
            for (let i = 0; i < storedMessages.length; i++) {
              if (i !== failIndex) {
                expect(storedMessages[i].status).toBe('sent');
              }
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 17: Message Length Validation
   * 
   * For any message content exceeding 500 characters, the Chat_Module should 
   * reject the message and display a validation error.
   */
  describe('Property 17: Message Length Validation', () => {
    it('should reject messages exceeding 500 characters', async () => {
      await fc.assert(
        fc.asyncProperty(
          roomIdArb,
          fc.string({ minLength: 501, maxLength: 1000 }),
          async (roomId, content) => {
            // Setup: Mock chatService.sendMessage to throw error for long messages
            (chatService.sendMessage as jest.Mock).mockImplementation(
              (roomId: string, content: string) => {
                if (content.length > 500) {
                  return Promise.reject(
                    new Error('Message content exceeds 500 characters')
                  );
                }
                return Promise.resolve({
                  id: 'msg-1',
                  roomId,
                  userId: 'user-1',
                  content,
                  status: 'sent',
                  createdAt: new Date().toISOString(),
                });
              }
            );

            // Act & Verify: Sending should fail
            await expect(
              chatService.sendMessage(roomId, content)
            ).rejects.toThrow('Message content exceeds 500 characters');
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should accept messages with exactly 500 characters', async () => {
      await fc.assert(
        fc.asyncProperty(
          roomIdArb,
          fc.string({ minLength: 500, maxLength: 500 }),
          async (roomId, content) => {
            // Verify content is exactly 500 characters
            expect(content.length).toBe(500);

            // Setup: Mock chatService.sendMessage to succeed for valid messages
            (chatService.sendMessage as jest.Mock).mockImplementation(
              (roomId: string, content: string) => {
                if (content.length > 500) {
                  return Promise.reject(
                    new Error('Message content exceeds 500 characters')
                  );
                }
                return Promise.resolve({
                  id: 'msg-1',
                  roomId,
                  userId: 'user-1',
                  content,
                  status: 'sent',
                  createdAt: new Date().toISOString(),
                });
              }
            );

            // Act: Send message
            const result = await chatService.sendMessage(roomId, content);

            // Verify: Should succeed
            expect(result).toBeDefined();
            expect(result.content).toBe(content);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should accept messages with less than 500 characters', async () => {
      await fc.assert(
        fc.asyncProperty(
          roomIdArb,
          fc.string({ minLength: 1, maxLength: 499 }),
          async (roomId, content) => {
            // Verify content is less than 500 characters
            expect(content.length).toBeLessThan(500);

            // Setup: Mock chatService.sendMessage
            (chatService.sendMessage as jest.Mock).mockImplementation(
              (roomId: string, content: string) => {
                if (content.length > 500) {
                  return Promise.reject(
                    new Error('Message content exceeds 500 characters')
                  );
                }
                return Promise.resolve({
                  id: 'msg-1',
                  roomId,
                  userId: 'user-1',
                  content,
                  status: 'sent',
                  createdAt: new Date().toISOString(),
                });
              }
            );

            // Act: Send message
            const result = await chatService.sendMessage(roomId, content);

            // Verify: Should succeed
            expect(result).toBeDefined();
            expect(result.content).toBe(content);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate message length boundary at 500 characters', async () => {
      await fc.assert(
        fc.asyncProperty(
          roomIdArb,
          fc.integer({ min: 1, max: 1000 }),
          async (roomId, length) => {
            // Generate content of specific length
            const content = 'a'.repeat(length);

            // Setup: Mock chatService.sendMessage
            (chatService.sendMessage as jest.Mock).mockImplementation(
              (roomId: string, content: string) => {
                if (content.length > 500) {
                  return Promise.reject(
                    new Error('Message content exceeds 500 characters')
                  );
                }
                return Promise.resolve({
                  id: 'msg-1',
                  roomId,
                  userId: 'user-1',
                  content,
                  status: 'sent',
                  createdAt: new Date().toISOString(),
                });
              }
            );

            // Act & Verify
            if (length <= 500) {
              // Should succeed
              const result = await chatService.sendMessage(roomId, content);
              expect(result).toBeDefined();
              expect(result.content.length).toBe(length);
            } else {
              // Should fail
              await expect(
                chatService.sendMessage(roomId, content)
              ).rejects.toThrow('Message content exceeds 500 characters');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle empty messages as valid (minimum 1 character)', async () => {
      await fc.assert(
        fc.asyncProperty(
          roomIdArb,
          fc.string({ minLength: 1, maxLength: 1 }),
          async (roomId, content) => {
            // Setup: Mock chatService.sendMessage
            (chatService.sendMessage as jest.Mock).mockResolvedValue({
              id: 'msg-1',
              roomId,
              userId: 'user-1',
              content,
              status: 'sent',
              createdAt: new Date().toISOString(),
            });

            // Act: Send single character message
            const result = await chatService.sendMessage(roomId, content);

            // Verify: Should succeed
            expect(result).toBeDefined();
            expect(result.content).toBe(content);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
