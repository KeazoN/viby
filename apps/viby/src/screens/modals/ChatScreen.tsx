/**
 * Chat Screen (Modal)
 * 
 * Realtime messaging interface with:
 * - Header with opponent info and track context
 * - Message list with FlatList
 * - Message input bar
 * - Typing indicator
 * 
 * Requirements: 7.1, 7.2, 7.6, 7.8
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import {
  useChatMessages,
  useTypingIndicator,
  useChatWebSocket,
  chatService,
} from '@viby/modules/chat';
import { useAuthStore } from '@viby/modules/auth';
import { useGameStore } from '@viby/modules/game';
import type { User } from '@viby/modules/game';
import {
  colors,
  spacing,
  typography,
  borderRadius,
  Card,
  animationPresets,
} from '@viby/shared/design-system';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Message } from '@viby/modules/chat';
import { MessageBubble } from '../chat/components/MessageBubble';
import { ReportUserModal } from '../chat/components/ReportUserModal';

type ChatScreenProps = NativeStackScreenProps<any, 'Chat'>;

export function ChatScreen({ route, navigation }: ChatScreenProps) {
  const { roomId } = route.params as { roomId: string };
  const { height } = useWindowDimensions();

  // Chat state from store
  const messages = useChatMessages(roomId);
  const typingUsers = useTypingIndicator(roomId);

  // Game state for track context
  const activeGame = useGameStore((state) => state.activeGame);

  // Auth state
  const currentUser = useAuthStore((state) => state.user);

  // Local state
  const [inputText, setInputText] = useState<string>('');
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(true);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);

  // Refs
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Animation values
  const modalTranslateY = useSharedValue(height);
  const modalOpacity = useSharedValue(0);

  // Subscribe to chat WebSocket events
  useChatWebSocket({
    roomId,
    onMessageReceived: (payload) => {
      // Scroll to bottom when new message arrives
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    },
  });

  // Modal entrance animation
  useEffect(() => {
    const slideAnimation = animationPresets.slideAndFadeIn(height);
    modalTranslateY.value = slideAnimation.translateY;
    modalOpacity.value = slideAnimation.opacity;
  }, [height]);

  // Load message history on mount
  useEffect(() => {
    const loadHistory = async () => {
      setIsLoadingHistory(true);
      try {
        await chatService.loadHistory(roomId);
        // Scroll to bottom after loading
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }, 100);
      } catch (error) {
        console.error('Failed to load chat history:', error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadHistory();
  }, [roomId]);

  const modalAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: modalTranslateY.value }],
    opacity: modalOpacity.value,
  }));

  const handleClose = () => {
    navigation.goBack();
  };

  const handleReportUser = () => {
    setShowReportModal(true);
  };

  const handleReportSubmitted = () => {
    // Optionally show a toast notification
    console.log('Report submitted successfully');
  };

  const handleSendMessage = async () => {
    const trimmedText = inputText.trim();
    if (!trimmedText || isSending) return;

    // Validate message length
    if (trimmedText.length > 500) {
      // TODO: Show error toast
      console.error('Message exceeds 500 characters');
      return;
    }

    setIsSending(true);
    const tempText = trimmedText;
    setInputText(''); // Clear input immediately for better UX

    try {
      await chatService.sendMessage(roomId, tempText);
      
      // Scroll to bottom after sending
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Restore input text on error
      setInputText(tempText);
    } finally {
      setIsSending(false);
    }
  };

  const handleRetryMessage = async (messageId: string, content: string) => {
    try {
      await chatService.sendMessage(roomId, content);
      
      // Scroll to bottom after retry
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Failed to retry message:', error);
    }
  };

  const handleInputChange = (text: string) => {
    setInputText(text);

    // Send typing indicator
    chatService.sendTypingIndicator(roomId, true);

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing indicator after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      chatService.sendTypingIndicator(roomId, false);
    }, 2000);
  };

  // Cleanup typing indicator on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      chatService.sendTypingIndicator(roomId, false);
    };
  }, [roomId]);

  const renderMessage = useCallback(
    ({ item }: { item: Message }) => {
      const isMyMessage = item.userId === currentUser?.id;
      return (
        <MessageBubble
          message={item}
          isMyMessage={isMyMessage}
          onRetry={item.status === 'failed' ? () => handleRetryMessage(item.id, item.content) : undefined}
        />
      );
    },
    [currentUser?.id]
  );

  const renderHeader = () => {
    if (!activeGame) return null;

    return (
      <View style={styles.trackContext}>
        <View style={styles.trackInfo}>
          <Text style={styles.trackTitle} numberOfLines={1}>
            {activeGame.track.title}
          </Text>
          <Text style={styles.trackArtist} numberOfLines={1}>
            {activeGame.track.artist}
          </Text>
        </View>
      </View>
    );
  };

  const renderFooter = () => {
    if (typingUsers.length === 0) return null;

    return (
      <View style={styles.typingIndicatorContainer}>
        <TypingIndicator />
      </View>
    );
  };

  const renderEmptyState = () => {
    if (isLoadingHistory) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={colors.accent.cyan} />
          <Text style={styles.emptyStateText}>Loading messages...</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateEmoji}>💬</Text>
        <Text style={styles.emptyStateText}>No messages yet</Text>
        <Text style={styles.emptyStateSubtext}>Start the conversation!</Text>
      </View>
    );
  };

  // Get opponent info from game
  const opponentUser = activeGame?.users.find(
    (u: User) => u.id !== currentUser?.id
  );

  return (
    <Animated.View style={[styles.container, modalAnimatedStyle]}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header with opponent info */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {opponentUser?.username?.slice(0, 2).toUpperCase() || '??'}
              </Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.opponentName}>
                {opponentUser?.username || 'Opponent'}
              </Text>
              {renderHeader()}
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={handleReportUser}
              style={styles.reportButton}
              accessibilityRole="button"
              accessibilityLabel="Report user"
            >
              <Text style={styles.reportButtonText}>⚠</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Close chat"
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Message list */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            // Auto-scroll to bottom when content size changes
            if (messages.length > 0) {
              flatListRef.current?.scrollToEnd({ animated: true });
            }
          }}
        />

        {/* Message input bar */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={handleInputChange}
            placeholder="Type a message..."
            placeholderTextColor={colors.text.tertiary}
            multiline
            maxLength={500}
            editable={!isSending}
            accessibilityLabel="Message input"
          />
          <TouchableOpacity
            onPress={handleSendMessage}
            style={[
              styles.sendButton,
              (!inputText.trim() || isSending) && styles.sendButtonDisabled,
            ]}
            disabled={!inputText.trim() || isSending}
            accessibilityRole="button"
            accessibilityLabel="Send message"
          >
            {isSending ? (
              <ActivityIndicator size="small" color={colors.text.primary} />
            ) : (
              <Text style={styles.sendButtonText}>➤</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Report User Modal */}
      {opponentUser && (
        <ReportUserModal
          visible={showReportModal}
          userId={opponentUser.id}
          username={opponentUser.username}
          roomId={roomId}
          onClose={() => setShowReportModal(false)}
          onReportSubmitted={handleReportSubmitted}
        />
      )}
    </Animated.View>
  );
}

/**
 * Typing indicator component with bounce animation
 * Memoized to prevent unnecessary re-renders (Requirement 15.4)
 */
const TypingIndicator = React.memo(function TypingIndicator() {
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    // Staggered bounce animation for dots
    const animateDot = (dotValue: Animated.SharedValue<number>, delay: number) => {
      dotValue.value = withSpring(-4, {
        damping: 2,
        stiffness: 100,
      });
      setTimeout(() => {
        dotValue.value = withSpring(0, {
          damping: 2,
          stiffness: 100,
        });
      }, 300);
    };

    const interval = setInterval(() => {
      animateDot(dot1, 0);
      setTimeout(() => animateDot(dot2, 0), 150);
      setTimeout(() => animateDot(dot3, 0), 300);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const dot1Style = useAnimatedStyle(() => ({
    transform: [{ translateY: dot1.value }],
  }));

  const dot2Style = useAnimatedStyle(() => ({
    transform: [{ translateY: dot2.value }],
  }));

  const dot3Style = useAnimatedStyle(() => ({
    transform: [{ translateY: dot3.value }],
  }));

  return (
    <View style={styles.typingIndicator}>
      <Text style={styles.typingText}>Typing</Text>
      <View style={styles.typingDots}>
        <Animated.View style={[styles.typingDot, dot1Style]} />
        <Animated.View style={[styles.typingDot, dot2Style]} />
        <Animated.View style={[styles.typingDot, dot3Style]} />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[4],
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.tertiary,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent.purple,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  avatarText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.bold,
  },
  headerInfo: {
    flex: 1,
  },
  opponentName: {
    color: colors.text.primary,
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semibold,
  },
  trackContext: {
    marginTop: spacing[1],
  },
  trackInfo: {
    flexDirection: 'column',
  },
  trackTitle: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
  },
  trackArtist: {
    color: colors.text.tertiary,
    fontSize: typography.fontSize.xs,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  reportButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportButtonText: {
    color: colors.error,
    fontSize: typography.fontSize.base,
    lineHeight: 20,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.lg,
    lineHeight: 20,
  },
  messageList: {
    padding: spacing[4],
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing[12],
  },
  emptyStateEmoji: {
    fontSize: 64,
    marginBottom: spacing[4],
  },
  emptyStateText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.medium,
    marginBottom: spacing[2],
  },
  emptyStateSubtext: {
    color: colors.text.tertiary,
    fontSize: typography.fontSize.base,
  },
  typingIndicatorContainer: {
    paddingVertical: spacing[2],
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    alignSelf: 'flex-start',
  },
  typingText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
  },
  typingDots: {
    flexDirection: 'row',
    gap: spacing[1],
  },
  typingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent.cyan,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing[4],
    backgroundColor: colors.background.secondary,
    borderTopWidth: 1,
    borderTopColor: colors.background.tertiary,
    gap: spacing[3],
  },
  input: {
    flex: 1,
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    color: colors.text.primary,
    fontSize: typography.fontSize.base,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent.cyan,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.background.tertiary,
    opacity: 0.5,
  },
  sendButtonText: {
    color: colors.background.primary,
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
  },
});
