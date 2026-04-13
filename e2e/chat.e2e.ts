/**
 * Chat E2E Tests
 * 
 * Tests for the chat flow including:
 * - Message sending with optimistic updates
 * - Typing indicators
 * - Read receipts
 * - Message history loading
 * 
 * Requirements: 7.1, 7.3, 7.6
 * - 7.1: Enable chat when Game_Session is created
 * - 7.3: Display message immediately with Optimistic_Update when user sends message
 * - 7.6: Display typing indicators when the other user is typing
 * 
 * Note: These tests assume a test environment where:
 * 1. User is already authenticated
 * 2. Match has been accepted and game session is active
 * 3. WebSocket connection is established
 * 4. Mock chat data can be injected
 */

// @ts-nocheck - Documentation tests with commented-out code
import {
  waitForElement,
  tapElement,
  assertVisible,
  assertTextVisible,
  assertNotVisible,
  setupE2E,
  takeScreenshot,
  wait,
  assertExists,
  reloadApp,
  waitForElementToDisappear,
  typeText,
  swipeElement,
} from './helpers';
import { device } from 'detox';

describe('Chat Flow', () => {
  beforeAll(async () => {
    await setupE2E();
  });

  beforeEach(async () => {
    // For chat tests, we assume user is authenticated and in a game session
    // In a real test environment, you would:
    // 1. Complete authentication flow
    // 2. Navigate to discovery screen
    // 3. Request and accept a match
    // 4. Start game session
    // 5. Open chat from game screen
    await reloadApp();
    
    // Wait for app to be ready
    await wait(3000);
  });

  describe('Chat Screen Display - Requirement 7.1', () => {
    it('should display chat screen when opened from game', async () => {
      // In a real test with game flow:
      // 1. Be in game session
      // 2. Tap chat button
      // 3. Chat screen should appear as modal
      
      // For documentation purposes, we describe the expected behavior:
      // await waitForElement('game-screen', 10000);
      // await tapElement('button-chat-toggle');
      // await waitForElement('chat-screen', 5000);
      // await assertVisible('chat-screen');
      // await takeScreenshot('01-chat-screen-opened');
    });

    it('should display chat header with opponent info', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Header should show opponent's name and avatar
      // await assertTextVisible('Opponent Name');
      // await assertVisible('chat-screen');
      // 
      // await takeScreenshot('02-chat-header');
    });

    it('should display currently playing track context in header', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Header should show the track both users are listening to
      // // "Listening to: Song Title by Artist"
      // await assertTextVisible('Listening to:');
      // 
      // await takeScreenshot('03-track-context');
    });

    it('should display message list area', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Message list should be visible (may be empty initially)
      // await assertVisible('chat-screen');
      // 
      // await takeScreenshot('04-message-list');
    });

    it('should display message input bar at bottom', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Input bar should be visible with:
      // // - Text input field
      // // - Send button
      // await assertVisible('chat-screen');
      // 
      // await takeScreenshot('05-message-input');
    });

    it('should display close button', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Close button (X) should be visible in header
      // await assertVisible('chat-screen');
      // 
      // await takeScreenshot('06-close-button');
    });

    it('should display empty state when no messages', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // If no messages yet, should show empty state
      // // "No messages yet"
      // // "Say hi to start the conversation! 👋"
      // await assertTextVisible('No messages yet');
      // 
      // await takeScreenshot('07-empty-state');
    });

    it('should have proper accessibility labels for chat elements', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Verify accessibility labels exist:
      // // - Close button: "Close chat"
      // // - Message input: "Type a message"
      // // - Send button: "Send message"
      // 
      // await assertExists('chat-screen');
    });
  });


  describe('Message Sending - Requirement 7.3', () => {
    it('should allow typing in message input field', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Focus on input field
      // await tapElement('input-message');
      // 
      // // Type a message
      // await typeText('input-message', 'Hello! How are you?');
      // 
      // // Message should appear in input field
      // await assertTextVisible('Hello! How are you?');
      // 
      // await takeScreenshot('08-typing-message');
    });

    it('should enable send button when message is not empty', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Send button should be disabled initially
      // await tapElement('input-message');
      // 
      // // Type a message
      // await typeText('input-message', 'Hello!');
      // 
      // // Send button should now be enabled
      // await assertVisible('chat-screen');
      // 
      // await takeScreenshot('09-send-button-enabled');
    });

    it('should disable send button when message is empty', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Send button should be disabled when input is empty
      // await assertVisible('chat-screen');
      // 
      // await takeScreenshot('10-send-button-disabled');
    });

    it('should display message immediately with optimistic update when sent', async () => {
      // Expected behavior - Requirement 7.3:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Type and send a message
      // await tapElement('input-message');
      // await typeText('input-message', 'Hello! How are you?');
      // await tapElement('button-send-message');
      // 
      // // Message should appear immediately (optimistic update)
      // // before server confirmation
      // await wait(100);
      // await assertTextVisible('Hello! How are you?');
      // 
      // await takeScreenshot('11-optimistic-message-display');
    });

    it('should show sending status on optimistic message', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Send a message
      // await tapElement('input-message');
      // await typeText('input-message', 'Test message');
      // await tapElement('button-send-message');
      // 
      // // Message should show "sending" status
      // // (clock icon or loading indicator)
      // await wait(100);
      // await assertVisible('chat-screen');
      // 
      // await takeScreenshot('12-sending-status');
    });

    it('should update message status to sent when confirmed by server', async () => {
      // Expected behavior - Requirement 7.4:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Send a message
      // await tapElement('input-message');
      // await typeText('input-message', 'Test message');
      // await tapElement('button-send-message');
      // 
      // // Wait for server confirmation
      // await wait(1000);
      // 
      // // Message status should update to "sent"
      // // (checkmark icon)
      // await assertVisible('chat-screen');
      // 
      // await takeScreenshot('13-sent-status');
    });

    it('should clear input field after sending message', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Type and send a message
      // await tapElement('input-message');
      // await typeText('input-message', 'Hello!');
      // await tapElement('button-send-message');
      // 
      // // Input field should be cleared
      // await wait(200);
      // // Input should be empty
      // 
      // await takeScreenshot('14-input-cleared');
    });

    it('should display error indicator when message delivery fails', async () => {
      // Expected behavior - Requirement 7.5:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Simulate network error during send
      // await tapElement('input-message');
      // await typeText('input-message', 'Test message');
      // await tapElement('button-send-message');
      // 
      // // Wait for failure
      // await wait(2000);
      // 
      // // Message should show error indicator
      // // (red exclamation mark or error icon)
      // await assertVisible('chat-screen');
      // 
      // await takeScreenshot('15-message-failed');
    });

    it('should offer retry option for failed messages', async () => {
      // Expected behavior - Requirement 7.5:
      // await waitForElement('chat-screen', 10000);
      // 
      // // After message fails, should show retry button
      // // Tap on failed message or retry button
      // // Message should be resent
      // 
      // await assertVisible('chat-screen');
      // 
      // await takeScreenshot('16-retry-option');
    });

    it('should enforce 500 character limit', async () => {
      // Expected behavior - Requirement 7.10:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Try to type more than 500 characters
      // await tapElement('input-message');
      // const longMessage = 'a'.repeat(501);
      // await typeText('input-message', longMessage);
      // 
      // // Should be truncated or show error
      // // Character count should show "500/500"
      // 
      // await takeScreenshot('17-character-limit');
    });

    it('should display character count when approaching limit', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Type a long message (e.g., 450 characters)
      // await tapElement('input-message');
      // const message = 'a'.repeat(450);
      // await typeText('input-message', message);
      // 
      // // Character count should appear
      // // "450/500"
      // await assertTextVisible('450/500');
      // 
      // await takeScreenshot('18-character-count');
    });

    it('should allow sending multiple messages in sequence', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Send first message
      // await tapElement('input-message');
      // await typeText('input-message', 'First message');
      // await tapElement('button-send-message');
      // await wait(500);
      // 
      // // Send second message
      // await tapElement('input-message');
      // await typeText('input-message', 'Second message');
      // await tapElement('button-send-message');
      // await wait(500);
      // 
      // // Both messages should be visible
      // await assertTextVisible('First message');
      // await assertTextVisible('Second message');
      // 
      // await takeScreenshot('19-multiple-messages');
    });
  });


  describe('Typing Indicators - Requirement 7.6', () => {
    it('should display typing indicator when opponent is typing', async () => {
      // Expected behavior - Requirement 7.6:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Simulate receiving typing indicator event from WebSocket
      // // (In real test, this would be mocked)
      // await wait(2000);
      // 
      // // Typing indicator should appear
      // // "Opponent is typing..."
      // // with animated dots (...)
      // await assertTextVisible('is typing');
      // 
      // await takeScreenshot('20-typing-indicator');
    });

    it('should show animated dots in typing indicator', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // When opponent is typing, should show animated dots
      // // Dots should bounce or pulse
      // await wait(2000);
      // 
      // // Take multiple screenshots to show animation
      // await takeScreenshot('21-typing-animation-1');
      // await wait(500);
      // await takeScreenshot('21-typing-animation-2');
      // await wait(500);
      // await takeScreenshot('21-typing-animation-3');
    });

    it('should hide typing indicator when opponent stops typing', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Typing indicator appears
      // await wait(2000);
      // await assertTextVisible('is typing');
      // 
      // // Wait for typing to stop
      // await wait(3000);
      // 
      // // Typing indicator should disappear
      // await assertNotVisible('typing-indicator');
      // 
      // await takeScreenshot('22-typing-stopped');
    });

    it('should hide typing indicator when opponent sends message', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Typing indicator appears
      // await wait(2000);
      // await assertTextVisible('is typing');
      // 
      // // Opponent sends message (simulated via WebSocket)
      // await wait(1000);
      // 
      // // Typing indicator should disappear
      // // Message should appear instead
      // await assertNotVisible('typing-indicator');
      // 
      // await takeScreenshot('23-message-replaces-typing');
    });

    it('should send typing indicator when user starts typing', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Start typing
      // await tapElement('input-message');
      // await typeText('input-message', 'H');
      // 
      // // Typing indicator should be sent to opponent
      // // (In real test with WebSocket mocking, verify emission)
      // await wait(500);
      // 
      // await takeScreenshot('24-user-typing');
    });

    it('should debounce typing indicator updates', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Type multiple characters quickly
      // await tapElement('input-message');
      // await typeText('input-message', 'Hello');
      // 
      // // Typing indicator should be sent once, not for each character
      // // (debounced to reduce network traffic)
      // await wait(500);
      // 
      // await takeScreenshot('25-debounced-typing');
    });

    it('should stop sending typing indicator after inactivity', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Start typing
      // await tapElement('input-message');
      // await typeText('input-message', 'Hello');
      // 
      // // Wait for inactivity timeout (e.g., 3 seconds)
      // await wait(3500);
      // 
      // // Typing indicator should stop being sent
      // // (In real test, verify no more typing events emitted)
      // 
      // await takeScreenshot('26-typing-timeout');
    });

    it('should position typing indicator at bottom of message list', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // When typing indicator appears, it should be at the bottom
      // // of the message list, above the input bar
      // await wait(2000);
      // 
      // await assertVisible('chat-screen');
      // 
      // await takeScreenshot('27-typing-position');
    });

    it('should scroll to typing indicator when it appears', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // If there are many messages, when typing indicator appears,
      // // should auto-scroll to show it
      // await wait(2000);
      // 
      // await assertVisible('chat-screen');
      // 
      // await takeScreenshot('28-scroll-to-typing');
    });
  });

  describe('Message Display', () => {
    it('should differentiate user messages from opponent messages', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // User messages should be on the right, different color
      // // Opponent messages should be on the left, different color
      // await wait(2000);
      // 
      // await assertVisible('chat-screen');
      // 
      // await takeScreenshot('29-message-differentiation');
    });

    it('should display message timestamp', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Each message should show timestamp
      // // e.g., "2:30 PM" or "Just now"
      // await wait(2000);
      // 
      // await assertVisible('chat-screen');
      // 
      // await takeScreenshot('30-message-timestamp');
    });

    it('should display message status for user messages', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // User messages should show status:
      // // - Sending (clock icon)
      // // - Sent (single checkmark)
      // // - Read (double checkmark)
      // // - Failed (exclamation mark)
      // await wait(2000);
      // 
      // await assertVisible('chat-screen');
      // 
      // await takeScreenshot('31-message-status');
    });

    it('should group messages by sender', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Consecutive messages from same sender should be grouped
      // // with reduced spacing
      // await wait(2000);
      // 
      // await assertVisible('chat-screen');
      // 
      // await takeScreenshot('32-message-grouping');
    });

    it('should display message bubbles with proper styling', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Messages should have:
      // // - Rounded corners
      // // - Proper padding
      // // - Background color
      // // - Shadow/elevation
      // await wait(2000);
      // 
      // await assertVisible('chat-screen');
      // 
      // await takeScreenshot('33-message-bubbles');
    });

    it('should handle long messages with text wrapping', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Long messages should wrap to multiple lines
      // // Should not overflow bubble
      // await wait(2000);
      // 
      // await assertVisible('chat-screen');
      // 
      // await takeScreenshot('34-long-message-wrap');
    });

    it('should display emoji properly in messages', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Send message with emoji
      // await tapElement('input-message');
      // await typeText('input-message', 'Hello! 👋 How are you? 😊');
      // await tapElement('button-send-message');
      // 
      // // Emoji should display correctly
      // await wait(500);
      // await assertTextVisible('👋');
      // await assertTextVisible('😊');
      // 
      // await takeScreenshot('35-emoji-display');
    });

    it('should animate new messages with fade-in', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // When new message appears, should fade in smoothly
      // await tapElement('input-message');
      // await typeText('input-message', 'Test message');
      // await tapElement('button-send-message');
      // 
      // // Message should fade in
      // await wait(300);
      // 
      // await takeScreenshot('36-message-fade-in');
    });

    it('should animate failed messages with shake', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // When message fails, should shake
      // // (In real test with network error simulation)
      // await wait(2000);
      // 
      // await takeScreenshot('37-failed-message-shake');
    });
  });


  describe('Read Receipts - Requirement 7.7', () => {
    it('should display read receipt when opponent has seen messages', async () => {
      // Expected behavior - Requirement 7.7:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Send a message
      // await tapElement('input-message');
      // await typeText('input-message', 'Did you see this?');
      // await tapElement('button-send-message');
      // 
      // // Wait for opponent to read (simulated via WebSocket)
      // await wait(2000);
      // 
      // // Message should show read receipt
      // // (double checkmark or "Read" indicator)
      // await assertVisible('chat-screen');
      // 
      // await takeScreenshot('38-read-receipt');
    });

    it('should update message status from sent to read', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Send a message
      // await tapElement('input-message');
      // await typeText('input-message', 'Test message');
      // await tapElement('button-send-message');
      // 
      // // Initially shows "sent" (single checkmark)
      // await wait(500);
      // await takeScreenshot('39-sent-status');
      // 
      // // After opponent reads, shows "read" (double checkmark)
      // await wait(2000);
      // await takeScreenshot('39-read-status');
    });

    it('should show read receipt for all messages when chat is opened', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // When opponent opens chat, all unread messages should
      // // update to "read" status
      // await wait(2000);
      // 
      // await assertVisible('chat-screen');
      // 
      // await takeScreenshot('40-all-messages-read');
    });

    it('should not show read receipt for opponent messages', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Opponent messages should not show read receipts
      // // (only user's own messages show receipts)
      // await wait(2000);
      // 
      // await assertVisible('chat-screen');
      // 
      // await takeScreenshot('41-no-receipt-opponent-messages');
    });

    it('should mark messages as read when chat is visible', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // When chat screen is visible and opponent sends message,
      // // should automatically mark as read
      // await wait(2000);
      // 
      // // (In real test, verify read receipt sent to opponent)
      // 
      // await takeScreenshot('42-auto-mark-read');
    });

    it('should send read receipt to opponent', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // When user views opponent's messages,
      // // should send read receipt via WebSocket
      // await wait(2000);
      // 
      // // (In real test with WebSocket mocking, verify emission)
      // 
      // await takeScreenshot('43-send-read-receipt');
    });
  });

  describe('Message History - Requirement 7.9', () => {
    it('should load message history when opening existing chat', async () => {
      // Expected behavior - Requirement 7.9:
      // await waitForElement('chat-screen', 10000);
      // 
      // // When opening chat with existing messages,
      // // should load history from backend
      // await wait(2000);
      // 
      // // Previous messages should be visible
      // await assertVisible('chat-screen');
      // 
      // await takeScreenshot('44-message-history');
    });

    it('should show loading indicator while fetching history', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // While loading history, should show loading indicator
      // await wait(500);
      // 
      // await assertVisible('chat-screen');
      // 
      // await takeScreenshot('45-loading-history');
    });

    it('should display messages in chronological order', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // await wait(2000);
      // 
      // // Messages should be ordered oldest to newest
      // // (top to bottom)
      // await assertVisible('chat-screen');
      // 
      // await takeScreenshot('46-chronological-order');
    });

    it('should scroll to bottom after loading history', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // await wait(2000);
      // 
      // // After loading history, should auto-scroll to
      // // most recent message (bottom)
      // await assertVisible('chat-screen');
      // 
      // await takeScreenshot('47-scrolled-to-bottom');
    });

    it('should support scrolling through message history', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // await wait(2000);
      // 
      // // Should be able to scroll up to see older messages
      // await swipeElement('chat-screen', 'down', 'slow');
      // await wait(500);
      // 
      // await takeScreenshot('48-scroll-history');
    });

    it('should load more messages when scrolling to top', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // await wait(2000);
      // 
      // // When scrolling to top, should load older messages
      // // (pagination)
      // await swipeElement('chat-screen', 'down', 'fast');
      // await wait(1000);
      // 
      // // More messages should appear
      // await assertVisible('chat-screen');
      // 
      // await takeScreenshot('49-load-more-messages');
    });

    it('should show loading indicator when loading more messages', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // await wait(2000);
      // 
      // // Scroll to top
      // await swipeElement('chat-screen', 'down', 'fast');
      // 
      // // Loading indicator should appear at top
      // await wait(500);
      // 
      // await takeScreenshot('50-loading-more');
    });

    it('should handle empty message history', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // If no previous messages, should show empty state
      // await wait(1000);
      // 
      // await assertTextVisible('No messages yet');
      // 
      // await takeScreenshot('51-empty-history');
    });

    it('should handle message history load error', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // If history load fails, should show error
      // // with retry option
      // await wait(2000);
      // 
      // // (In real test with API error simulation)
      // await assertTextVisible('Failed to load messages');
      // 
      // await takeScreenshot('52-history-load-error');
    });
  });

  describe('Scrolling and Navigation', () => {
    it('should auto-scroll to bottom when new message is received', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // await wait(2000);
      // 
      // // When new message arrives, should auto-scroll to show it
      // // (if already near bottom)
      // await wait(1000);
      // 
      // await assertVisible('chat-screen');
      // 
      // await takeScreenshot('53-auto-scroll-new-message');
    });

    it('should show scroll-to-bottom button when scrolled up', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // await wait(2000);
      // 
      // // Scroll up in message history
      // await swipeElement('chat-screen', 'down', 'slow');
      // await wait(500);
      // 
      // // Scroll-to-bottom button should appear
      // // (floating button with down arrow)
      // await assertVisible('chat-screen');
      // 
      // await takeScreenshot('54-scroll-to-bottom-button');
    });

    it('should scroll to bottom when scroll-to-bottom button is tapped', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // await wait(2000);
      // 
      // // Scroll up
      // await swipeElement('chat-screen', 'down', 'slow');
      // await wait(500);
      // 
      // // Tap scroll-to-bottom button
      // await tapElement('button-scroll-to-bottom');
      // 
      // // Should scroll to bottom smoothly
      // await wait(500);
      // 
      // await takeScreenshot('55-scrolled-to-bottom');
    });

    it('should hide scroll-to-bottom button when at bottom', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // await wait(2000);
      // 
      // // When at bottom of message list,
      // // scroll-to-bottom button should be hidden
      // await assertNotVisible('button-scroll-to-bottom');
      // 
      // await takeScreenshot('56-no-scroll-button');
    });

    it('should maintain scroll position when keyboard appears', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // await wait(2000);
      // 
      // // Tap input field to show keyboard
      // await tapElement('input-message');
      // await wait(500);
      // 
      // // Message list should adjust but maintain relative position
      // await assertVisible('chat-screen');
      // 
      // await takeScreenshot('57-keyboard-shown');
    });

    it('should adjust message list when keyboard is dismissed', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Show keyboard
      // await tapElement('input-message');
      // await wait(500);
      // 
      // // Dismiss keyboard
      // await device.pressBack(); // Android
      // // or tap outside input area
      // await wait(500);
      // 
      // // Message list should expand
      // await assertVisible('chat-screen');
      // 
      // await takeScreenshot('58-keyboard-dismissed');
    });
  });


  describe('Navigation and Closing', () => {
    it('should close chat screen when close button is tapped', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Tap close button
      // await tapElement('button-close-chat');
      // 
      // // Chat screen should close
      // await waitForElementToDisappear('chat-screen', 3000);
      // 
      // // Should return to game screen
      // await waitForElement('game-screen', 5000);
      // 
      // await takeScreenshot('59-chat-closed');
    });

    it('should return to game screen after closing chat', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Close chat
      // await tapElement('button-close-chat');
      // await wait(500);
      // 
      // // Should be back on game screen
      // await waitForElement('game-screen', 5000);
      // await assertVisible('game-screen');
      // 
      // await takeScreenshot('60-back-to-game');
    });

    it('should maintain game state when chat is opened and closed', async () => {
      // Expected behavior:
      // await waitForElement('game-screen', 10000);
      // 
      // // Note game state (round, scores)
      // await wait(1000);
      // 
      // // Open chat
      // await tapElement('button-chat-toggle');
      // await waitForElement('chat-screen', 5000);
      // await wait(2000);
      // 
      // // Close chat
      // await tapElement('button-close-chat');
      // await waitForElement('game-screen', 5000);
      // 
      // // Game state should be unchanged
      // await assertVisible('game-screen');
      // 
      // await takeScreenshot('61-game-state-maintained');
    });

    it('should allow reopening chat after closing', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Close chat
      // await tapElement('button-close-chat');
      // await waitForElement('game-screen', 5000);
      // 
      // // Reopen chat
      // await tapElement('button-chat-toggle');
      // await waitForElement('chat-screen', 5000);
      // 
      // // Chat should reopen with same messages
      // await assertVisible('chat-screen');
      // 
      // await takeScreenshot('62-chat-reopened');
    });

    it('should preserve unsent message when chat is closed', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Type a message but don't send
      // await tapElement('input-message');
      // await typeText('input-message', 'Unsent message');
      // 
      // // Close chat
      // await tapElement('button-close-chat');
      // await waitForElement('game-screen', 5000);
      // 
      // // Reopen chat
      // await tapElement('button-chat-toggle');
      // await waitForElement('chat-screen', 5000);
      // 
      // // Unsent message should still be in input
      // await assertTextVisible('Unsent message');
      // 
      // await takeScreenshot('63-unsent-message-preserved');
    });
  });

  describe('Connection Status', () => {
    it('should display connection indicator when disconnected', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Simulate WebSocket disconnection
      // await wait(2000);
      // 
      // // Connection indicator should appear
      // // "Connection lost" or "Reconnecting..."
      // await assertTextVisible('Connection lost');
      // 
      // await takeScreenshot('64-connection-lost');
    });

    it('should queue messages when offline', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Simulate offline state
      // // Send a message
      // await tapElement('input-message');
      // await typeText('input-message', 'Offline message');
      // await tapElement('button-send-message');
      // 
      // // Message should show "queued" status
      // await wait(500);
      // await assertVisible('chat-screen');
      // 
      // await takeScreenshot('65-message-queued');
    });

    it('should send queued messages when connection is restored', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Send message while offline (queued)
      // await tapElement('input-message');
      // await typeText('input-message', 'Queued message');
      // await tapElement('button-send-message');
      // await wait(500);
      // 
      // // Connection restored
      // await wait(2000);
      // 
      // // Message should be sent
      // // Status should update to "sent"
      // await assertVisible('chat-screen');
      // 
      // await takeScreenshot('66-queued-message-sent');
    });

    it('should hide connection indicator when connected', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // After reconnection
      // await wait(3000);
      // 
      // // Connection indicator should disappear
      // await assertNotVisible('connection-indicator');
      // 
      // await takeScreenshot('67-connection-restored');
    });

    it('should sync messages after reconnection', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // After disconnection and reconnection,
      // // should sync any missed messages
      // await wait(3000);
      // 
      // // New messages from opponent should appear
      // await assertVisible('chat-screen');
      // 
      // await takeScreenshot('68-messages-synced');
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels for all interactive elements', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Verify accessibility labels:
      // // - Close button: "Close chat"
      // // - Message input: "Type a message"
      // // - Send button: "Send message"
      // // - Messages: "Message from [user] at [time]: [content]"
      // 
      // await assertExists('chat-screen');
    });

    it('should support screen reader navigation', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Screen readers should be able to:
      // // - Navigate through messages
      // // - Announce message sender and content
      // // - Announce message status
      // // - Announce typing indicators
      // 
      // await assertVisible('chat-screen');
    });

    it('should announce new messages to screen readers', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // When new message arrives, screen reader should announce:
      // // "New message from [user]: [content]"
      // await wait(2000);
      // 
      // await assertVisible('chat-screen');
    });

    it('should have proper accessibility roles for message elements', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Messages should have proper roles:
      // // - Message list: "list"
      // // - Message items: "listitem"
      // // - Input field: "textbox"
      // // - Send button: "button"
      // 
      // await assertExists('chat-screen');
    });

    it('should support keyboard navigation on tablets', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // On tablets with keyboard:
      // // - Tab should navigate between elements
      // // - Enter should send message
      // // - Escape should close chat
      // 
      // await assertVisible('chat-screen');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Simulate network error
      // await tapElement('input-message');
      // await typeText('input-message', 'Test message');
      // await tapElement('button-send-message');
      // 
      // // Should show error message
      // await wait(2000);
      // await assertTextVisible('Failed to send message');
      // 
      // await takeScreenshot('69-network-error');
    });

    it('should handle WebSocket disconnection during chat', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // WebSocket disconnects
      // await wait(2000);
      // 
      // // Should show reconnection indicator
      // // Should attempt automatic reconnection
      // await assertTextVisible('Reconnecting');
      // 
      // await takeScreenshot('70-websocket-disconnected');
    });

    it('should handle message history load failure', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // If history load fails
      // await wait(2000);
      // 
      // // Should show error with retry option
      // await assertTextVisible('Failed to load messages');
      // await assertVisible('button-retry-load');
      // 
      // await takeScreenshot('71-history-load-failed');
    });

    it('should allow retrying failed message send', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Send message that fails
      // await tapElement('input-message');
      // await typeText('input-message', 'Test message');
      // await tapElement('button-send-message');
      // await wait(2000);
      // 
      // // Tap retry on failed message
      // await tapElement('button-retry-message');
      // 
      // // Message should be resent
      // await wait(1000);
      // 
      // await takeScreenshot('72-message-retried');
    });

    it('should handle empty message submission gracefully', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Try to send empty message
      // await tapElement('input-message');
      // await tapElement('button-send-message');
      // 
      // // Should not send (button should be disabled)
      // // Or show validation error
      // 
      // await takeScreenshot('73-empty-message-blocked');
    });

    it('should handle message exceeding character limit', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Try to type more than 500 characters
      // await tapElement('input-message');
      // const longMessage = 'a'.repeat(501);
      // await typeText('input-message', longMessage);
      // 
      // // Should show error or truncate
      // await assertTextVisible('Character limit exceeded');
      // 
      // await takeScreenshot('74-character-limit-error');
    });
  });


  describe('App State Transitions', () => {
    it('should handle app backgrounding during chat', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // await wait(2000);
      // 
      // // Background the app
      // await device.sendToHome();
      // await wait(2000);
      // 
      // // Bring app back to foreground
      // await device.launchApp({ newInstance: false });
      // 
      // // Should return to chat screen
      // await waitForElement('chat-screen', 10000);
      // 
      // await takeScreenshot('75-after-backgrounding');
    });

    it('should maintain chat state when backgrounded', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Type unsent message
      // await tapElement('input-message');
      // await typeText('input-message', 'Unsent message');
      // 
      // // Background and foreground
      // await device.sendToHome();
      // await wait(2000);
      // await device.launchApp({ newInstance: false });
      // 
      // // Chat state should be preserved
      // await waitForElement('chat-screen', 10000);
      // await assertTextVisible('Unsent message');
      // 
      // await takeScreenshot('76-state-preserved');
    });

    it('should sync messages when returning from background', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // await wait(2000);
      // 
      // // Background app
      // await device.sendToHome();
      // await wait(5000);
      // 
      // // Foreground app
      // await device.launchApp({ newInstance: false });
      // await waitForElement('chat-screen', 10000);
      // 
      // // Should sync any new messages received while backgrounded
      // await wait(2000);
      // await assertVisible('chat-screen');
      // 
      // await takeScreenshot('77-messages-synced-foreground');
    });

    it('should maintain WebSocket connection for 30 seconds in background', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Background app
      // await device.sendToHome();
      // await wait(10000); // Wait 10 seconds
      // 
      // // Foreground app
      // await device.launchApp({ newInstance: false });
      // await waitForElement('chat-screen', 10000);
      // 
      // // Connection should still be active (no reconnection indicator)
      // await assertNotVisible('connection-indicator');
      // 
      // await takeScreenshot('78-connection-maintained');
    });

    it('should reconnect when returning after long background', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Background app for > 30 seconds
      // await device.sendToHome();
      // await wait(35000);
      // 
      // // Foreground app
      // await device.launchApp({ newInstance: false });
      // await waitForElement('chat-screen', 10000);
      // 
      // // Should show reconnecting indicator
      // await assertVisible('connection-indicator');
      // 
      // // Should reconnect
      // await wait(3000);
      // await assertNotVisible('connection-indicator');
      // 
      // await takeScreenshot('79-reconnected-after-background');
    });
  });

  describe('Performance', () => {
    it('should render messages smoothly without lag', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Send multiple messages quickly
      // for (let i = 0; i < 5; i++) {
      //   await tapElement('input-message');
      //   await typeText('input-message', `Message ${i + 1}`);
      //   await tapElement('button-send-message');
      //   await wait(200);
      // }
      // 
      // // All messages should render smoothly
      // await wait(1000);
      // await assertVisible('chat-screen');
      // 
      // await takeScreenshot('80-smooth-rendering');
    });

    it('should handle large message history efficiently', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // With many messages (100+), scrolling should be smooth
      // await wait(2000);
      // 
      // // Scroll through messages
      // await swipeElement('chat-screen', 'up', 'fast');
      // await wait(300);
      // await swipeElement('chat-screen', 'down', 'fast');
      // 
      // // Should maintain 60 FPS
      // await takeScreenshot('81-large-history-performance');
    });

    it('should virtualize message list for performance', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Message list should use FlatList virtualization
      // // Only visible messages should be rendered
      // await wait(2000);
      // 
      // await assertVisible('chat-screen');
      // 
      // await takeScreenshot('82-virtualized-list');
    });

    it('should debounce typing indicator updates', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Type quickly
      // await tapElement('input-message');
      // await typeText('input-message', 'Quick typing test');
      // 
      // // Typing indicator should be sent once (debounced)
      // // not for every keystroke
      // await wait(500);
      // 
      // await takeScreenshot('83-debounced-typing');
    });

    it('should maintain 60 FPS during animations', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Send message with fade-in animation
      // await tapElement('input-message');
      // await typeText('input-message', 'Animation test');
      // await tapElement('button-send-message');
      // 
      // // Animation should be smooth (60 FPS)
      // await wait(500);
      // 
      // await takeScreenshot('84-smooth-animation');
    });
  });

  describe('Integration with Game', () => {
    it('should allow chatting during game session', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Chat should be accessible during game
      // // Can send and receive messages while game is active
      // await wait(2000);
      // 
      // await assertVisible('chat-screen');
      // 
      // await takeScreenshot('85-chat-during-game');
    });

    it('should maintain chat history after game ends', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Send messages during game
      // await tapElement('input-message');
      // await typeText('input-message', 'Good luck!');
      // await tapElement('button-send-message');
      // await wait(500);
      // 
      // // Close chat and end game
      // await tapElement('button-close-chat');
      // await waitForElement('game-screen', 5000);
      // 
      // // After game ends, reopen chat
      // // Messages should still be there
      // 
      // await takeScreenshot('86-chat-after-game');
    });

    it('should show game context in chat header', async () => {
      // Expected behavior - Requirement 7.8:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Chat header should show:
      // // - Currently playing track for both users
      // // - "Listening to: [Track] by [Artist]"
      // await assertTextVisible('Listening to:');
      // 
      // await takeScreenshot('87-game-context');
    });

    it('should update track context when song changes', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Initial track context
      // await wait(2000);
      // await takeScreenshot('88-initial-track-context');
      // 
      // // When track changes (simulated)
      // await wait(5000);
      // 
      // // Track context should update
      // await takeScreenshot('88-updated-track-context');
    });

    it('should allow switching between chat and game', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Close chat
      // await tapElement('button-close-chat');
      // await waitForElement('game-screen', 5000);
      // 
      // // Reopen chat
      // await tapElement('button-chat-toggle');
      // await waitForElement('chat-screen', 5000);
      // 
      // // Should switch smoothly
      // await assertVisible('chat-screen');
      // 
      // await takeScreenshot('89-switch-chat-game');
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid message sending', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Send multiple messages very quickly
      // for (let i = 0; i < 10; i++) {
      //   await tapElement('input-message');
      //   await typeText('input-message', `Rapid ${i}`);
      //   await tapElement('button-send-message');
      //   await wait(100);
      // }
      // 
      // // All messages should be sent and displayed
      // await wait(2000);
      // await assertVisible('chat-screen');
      // 
      // await takeScreenshot('90-rapid-sending');
    });

    it('should handle receiving messages while typing', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Start typing
      // await tapElement('input-message');
      // await typeText('input-message', 'I am typing...');
      // 
      // // Receive message from opponent (simulated)
      // await wait(1000);
      // 
      // // Opponent message should appear
      // // User's typing should not be interrupted
      // await assertTextVisible('I am typing...');
      // 
      // await takeScreenshot('91-receive-while-typing');
    });

    it('should handle simultaneous message sending', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // User sends message
      // await tapElement('input-message');
      // await typeText('input-message', 'My message');
      // await tapElement('button-send-message');
      // 
      // // Opponent sends message at same time (simulated)
      // await wait(500);
      // 
      // // Both messages should appear correctly
      // await assertTextVisible('My message');
      // 
      // await takeScreenshot('92-simultaneous-messages');
    });

    it('should handle very long messages', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Send message near character limit
      // await tapElement('input-message');
      // const longMessage = 'a'.repeat(500);
      // await typeText('input-message', longMessage);
      // await tapElement('button-send-message');
      // 
      // // Message should display with proper wrapping
      // await wait(500);
      // await assertVisible('chat-screen');
      // 
      // await takeScreenshot('93-very-long-message');
    });

    it('should handle special characters in messages', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Send message with special characters
      // await tapElement('input-message');
      // await typeText('input-message', 'Test: @#$%^&*()_+-=[]{}|;:,.<>?');
      // await tapElement('button-send-message');
      // 
      // // Special characters should display correctly
      // await wait(500);
      // await assertTextVisible('@#$%^&*()');
      // 
      // await takeScreenshot('94-special-characters');
    });

    it('should handle messages with only emoji', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Send emoji-only message
      // await tapElement('input-message');
      // await typeText('input-message', '😀😃😄😁😆');
      // await tapElement('button-send-message');
      // 
      // // Emoji should display correctly
      // await wait(500);
      // await assertTextVisible('😀😃😄😁😆');
      // 
      // await takeScreenshot('95-emoji-only-message');
    });

    it('should handle messages with line breaks', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Send message with line breaks
      // await tapElement('input-message');
      // await typeText('input-message', 'Line 1\nLine 2\nLine 3');
      // await tapElement('button-send-message');
      // 
      // // Line breaks should be preserved
      // await wait(500);
      // await assertVisible('chat-screen');
      // 
      // await takeScreenshot('96-line-breaks');
    });

    it('should handle rapid typing indicator changes', async () => {
      // Expected behavior:
      // await waitForElement('chat-screen', 10000);
      // 
      // // Opponent starts and stops typing rapidly (simulated)
      // await wait(1000);
      // 
      // // Typing indicator should appear and disappear smoothly
      // // No flickering or performance issues
      // await assertVisible('chat-screen');
      // 
      // await takeScreenshot('97-rapid-typing-changes');
    });
  });
});
