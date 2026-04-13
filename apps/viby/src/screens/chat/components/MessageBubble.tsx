/**
 * MessageBubble Component
 * 
 * Displays individual chat messages with:
 * - Message content and timestamp
 * - Message status (sending, sent, failed)
 * - Differentiation between user and opponent messages
 * - Read receipts
 * - Retry functionality for failed messages
 * 
 * Requirements: 7.3, 7.4, 7.5, 7.7
 */

import { useEffect } from 'react';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import type { Message } from '@viby/modules/chat';
import {
  colors,
  spacing,
  typography,
  borderRadius,
} from '@viby/shared/design-system';

export interface MessageBubbleProps {
  /**
   * Message data
   */
  message: Message;
  /**
   * Whether this message was sent by the current user
   */
  isMyMessage: boolean;
  /**
   * Whether the message has been read by the recipient
   */
  isRead?: boolean;
  /**
   * Callback to retry sending a failed message
   */
  onRetry?: () => void;
  /**
   * Test ID for testing
   */
  testID?: string;
}

export const MessageBubble = React.memo(function MessageBubble({
  message,
  isMyMessage,
  isRead = false,
  onRetry,
  testID,
}: MessageBubbleProps) {
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(0);

  useEffect(() => {
    // Fade in animation
    opacity.value = withTiming(1, { duration: 300 });
  }, []);

  // Shake animation for failed messages
  useEffect(() => {
    if (message.status === 'failed') {
      // Trigger shake animation
      translateX.value = withSequence(
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
  }, [message.status]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  // Format timestamp
  const timestamp = new Date(message.createdAt);
  const timeString = timestamp.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  // Get status indicator
  const getStatusIndicator = () => {
    if (!isMyMessage) return null;

    switch (message.status) {
      case 'sending':
        return <Text style={styles.messageStatus}>⏳</Text>;
      case 'sent':
        return (
          <Text style={styles.messageStatus} accessibilityLabel="Message sent">
            {isRead ? '✓✓' : '✓'}
          </Text>
        );
      case 'failed':
        return (
          <View style={styles.failedContainer}>
            <Text
              style={[styles.messageStatus, styles.failedStatus]}
              accessibilityLabel="Message failed"
            >
              ⚠️
            </Text>
            {onRetry && (
              <TouchableOpacity
                onPress={onRetry}
                style={styles.retryButton}
                accessibilityRole="button"
                accessibilityLabel="Retry sending message"
              >
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <Animated.View
      style={[
        styles.messageBubbleContainer,
        isMyMessage ? styles.myMessageContainer : styles.theirMessageContainer,
        animatedStyle,
      ]}
      testID={testID}
      accessibilityRole="text"
      accessibilityLabel={`${isMyMessage ? 'You' : 'Opponent'}: ${message.content}`}
    >
      <View
        style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessageBubble : styles.theirMessageBubble,
          message.status === 'failed' && styles.failedMessageBubble,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            isMyMessage ? styles.myMessageText : styles.theirMessageText,
          ]}
        >
          {message.content}
        </Text>
        <View style={styles.messageFooter}>
          <Text
            style={[
              styles.messageTime,
              isMyMessage ? styles.myMessageTime : styles.theirMessageTime,
            ]}
            accessibilityLabel={`Sent at ${timeString}`}
          >
            {timeString}
          </Text>
          {getStatusIndicator()}
        </View>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  messageBubbleContainer: {
    marginBottom: spacing[3],
    maxWidth: '80%',
  },
  myMessageContainer: {
    alignSelf: 'flex-end',
  },
  theirMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    borderRadius: borderRadius.lg,
    padding: spacing[3],
  },
  myMessageBubble: {
    backgroundColor: colors.accent.cyan,
  },
  theirMessageBubble: {
    backgroundColor: colors.background.secondary,
  },
  failedMessageBubble: {
    opacity: 0.7,
    borderWidth: 1,
    borderColor: colors.status.error,
  },
  messageText: {
    fontSize: typography.fontSize.base,
    lineHeight: typography.fontSize.base * typography.lineHeight.normal,
    marginBottom: spacing[1],
  },
  myMessageText: {
    color: colors.background.primary,
  },
  theirMessageText: {
    color: colors.text.primary,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing[1],
  },
  messageTime: {
    fontSize: typography.fontSize.xs,
  },
  myMessageTime: {
    color: colors.background.primary,
    opacity: 0.7,
  },
  theirMessageTime: {
    color: colors.text.tertiary,
  },
  messageStatus: {
    fontSize: typography.fontSize.xs,
  },
  failedStatus: {
    color: colors.status.error,
  },
  failedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  retryButton: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    backgroundColor: colors.status.error,
    borderRadius: borderRadius.sm,
  },
  retryText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.semibold,
  },
});
