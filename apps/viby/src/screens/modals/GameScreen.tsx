/**
 * Game Screen (Modal)
 * 
 * Displays the game session UI with:
 * - Round number and scores
 * - Question and answer options
 * - Countdown timer
 * - Chat toggle button
 * - Close button
 * 
 * Requirements: 6.1, 6.3, 6.5, 6.6
 */

import { useEffect, useState } from 'react';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useGameStore, useGameWebSocket } from '@viby/modules/game';
import { gameService } from '@viby/modules/game';
import { matchmakingService } from '@viby/modules/matchmaking';
import { useAuthStore } from '@viby/modules/auth';
import { useRealtimeStore } from '@viby/modules/realtime';
import {
  colors,
  spacing,
  typography,
  borderRadius,
  Card,
  Button,
  animationPresets,
  springConfigs,
  timingConfigs,
} from '@viby/shared/design-system';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type GameScreenProps = NativeStackScreenProps<any, 'Game'>;

export function GameScreen({ route, navigation }: GameScreenProps) {
  const { roomId } = route.params as { roomId: string };
  const { height } = useWindowDimensions();

  // Game state from store - use selectors to minimize re-renders (Requirement 9.7)
  const activeGame = useGameStore((state) => state.activeGame);
  const currentRound = useGameStore((state) => state.currentRound);
  const scores = useGameStore((state) => state.scores);
  const myAnswer = useGameStore((state) => state.myAnswer);

  // Connection status from realtime store
  const connectionStatus = useRealtimeStore((state) => state.connectionStatus);

  // Local state
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  const [showConfetti, setShowConfetti] = useState<boolean>(false);
  const [gameEnded, setGameEnded] = useState<boolean>(false);
  const [finalScores, setFinalScores] = useState<Record<string, number> | null>(null);
  const [winner, setWinner] = useState<string | null>(null);
  const [isRequestingRematch, setIsRequestingRematch] = useState<boolean>(false);
  const [isRecoveringState, setIsRecoveringState] = useState<boolean>(false);

  // Animation values
  const modalTranslateY = useSharedValue(height);
  const modalOpacity = useSharedValue(0);
  const confettiOpacity = useSharedValue(0);
  const confettiScale = useSharedValue(0);

  // Subscribe to game WebSocket events
  useGameWebSocket({
    roomId,
    onRoundStarted: (payload) => {
      // Reset timer when new round starts
      setTimeRemaining(payload.round.timeLimit);
      setSelectedAnswer(null);
      setCorrectAnswer(null);
      setShowFeedback(false);
    },
    onRoundEnded: (payload) => {
      // Stop timer when round ends
      setTimeRemaining(0);
      // Show correct answer and feedback
      setCorrectAnswer(payload.correctAnswer);
      setShowFeedback(true);
      
      // Show confetti if user answered correctly
      if (selectedAnswer === payload.correctAnswer) {
        setShowConfetti(true);
        
        // Trigger confetti animation
        confettiOpacity.value = withSequence(
          withTiming(1, timingConfigs.fast),
          withDelay(1500, withTiming(0, timingConfigs.slow))
        );
        
        confettiScale.value = withSequence(
          withTiming(1, { duration: 300, easing: Easing.out(Easing.back(1.5)) }),
          withDelay(1500, withTiming(1.2, timingConfigs.slow))
        );
        
        // Hide confetti after animation
        setTimeout(() => {
          setShowConfetti(false);
        }, 2000);
      }
      
      // Hide feedback after 3 seconds
      setTimeout(() => {
        setShowFeedback(false);
      }, 3000);
    },
    onGameEnded: (payload) => {
      // Show game end screen with final scores
      setGameEnded(true);
      setFinalScores(payload.finalScores);
      setWinner(payload.winner);
    },
  });

  // Modal entrance animation
  useEffect(() => {
    const slideAnimation = animationPresets.slideAndFadeIn(height);
    modalTranslateY.value = slideAnimation.translateY;
    modalOpacity.value = slideAnimation.opacity;
  }, [height]);

  // Handle reconnection - request game state when connection is restored
  useEffect(() => {
    let previousStatus = connectionStatus;

    // When transitioning from disconnected/reconnecting to connected, recover game state
    if (
      (previousStatus === 'disconnected' || previousStatus === 'reconnecting') &&
      connectionStatus === 'connected' &&
      activeGame &&
      !gameEnded
    ) {
      const recoverGameState = async () => {
        setIsRecoveringState(true);
        try {
          const { game, currentRound: recoveredRound } = await gameService.getGameState(roomId);
          
          // Update game store with recovered state
          useGameStore.getState().startGame(game);
          if (recoveredRound) {
            useGameStore.getState().updateRound(recoveredRound);
            // Reset timer with remaining time
            setTimeRemaining(recoveredRound.timeLimit);
          }
          
          console.log('Game state recovered successfully');
        } catch (error) {
          console.error('Failed to recover game state:', error);
        } finally {
          setIsRecoveringState(false);
        }
      };

      recoverGameState();
    }

    previousStatus = connectionStatus;
  }, [connectionStatus, activeGame, gameEnded, roomId]);

  // Countdown timer
  useEffect(() => {
    if (!currentRound || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentRound, timeRemaining]);

  const modalAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: modalTranslateY.value }],
    opacity: modalOpacity.value,
  }));

  const confettiAnimatedStyle = useAnimatedStyle(() => ({
    opacity: confettiOpacity.value,
    transform: [{ scale: confettiScale.value }],
  }));

  const handleAnswerSelect = async (answer: string) => {
    if (!currentRound || myAnswer || showFeedback) return; // Already answered or showing feedback

    // Optimistic update - show selection immediately
    setSelectedAnswer(answer);
    
    // Submit answer to backend
    try {
      await gameService.submitAnswer(roomId, currentRound.id, answer);
    } catch (error) {
      console.error('Failed to submit answer:', error);
      // Reset selection on error
      setSelectedAnswer(null);
    }
  };

  const handleClose = () => {
    navigation.goBack();
  };

  const handleChatToggle = () => {
    navigation.navigate('Chat', { roomId });
  };

  const handleRematch = async () => {
    if (!activeGame) return;
    
    setIsRequestingRematch(true);
    try {
      // Request a new match with the same track
      await matchmakingService.requestMatch(activeGame.track.id);
      // Close current game and return to discovery
      navigation.navigate('Discovery');
    } catch (error) {
      console.error('Failed to request rematch:', error);
    } finally {
      setIsRequestingRematch(false);
    }
  };

  const handleReturnToDiscovery = () => {
    navigation.navigate('Discovery');
  };

  if (!activeGame || !currentRound) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading game...</Text>
      </View>
    );
  }

  const currentUserId = useAuthStore.getState().user?.id || Object.keys(scores)[0];
  const opponentId = Object.keys(scores).find((id) => id !== currentUserId);
  const myScore = finalScores?.[currentUserId] || scores[currentUserId] || 0;
  const opponentScore = opponentId ? (finalScores?.[opponentId] || scores[opponentId] || 0) : 0;

  // Show game end screen if game has ended
  if (gameEnded && finalScores) {
    const isWinner = winner === currentUserId;
    const isTie = winner === null;
    
    return (
      <Animated.View style={[styles.container, modalAnimatedStyle]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.roundText}>Game Over</Text>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Close game"
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Winner announcement */}
          <Card variant="elevated" padding={6} style={styles.winnerCard}>
            <Text style={styles.winnerEmoji}>
              {isTie ? '🤝' : isWinner ? '🎉' : '😔'}
            </Text>
            <Text style={styles.winnerText}>
              {isTie ? "It's a Tie!" : isWinner ? 'You Win!' : 'You Lose'}
            </Text>
            {!isTie && (
              <Text style={styles.winnerSubtext}>
                {isWinner ? 'Great job!' : 'Better luck next time!'}
              </Text>
            )}
          </Card>

          {/* Final scores */}
          <View style={styles.finalScoresContainer}>
            <Text style={styles.finalScoresTitle}>Final Scores</Text>
            
            <View style={styles.finalScoreItem}>
              <View style={styles.finalScoreLeft}>
                <Text style={styles.finalScoreLabel}>You</Text>
                {isWinner && !isTie && <Text style={styles.winnerBadge}>👑</Text>}
              </View>
              <Text style={[
                styles.finalScoreValue,
                isWinner && !isTie && styles.finalScoreValueWinner
              ]}>
                {myScore}
              </Text>
            </View>

            <View style={styles.finalScoreDivider} />

            <View style={styles.finalScoreItem}>
              <View style={styles.finalScoreLeft}>
                <Text style={styles.finalScoreLabel}>Opponent</Text>
                {!isWinner && !isTie && <Text style={styles.winnerBadge}>👑</Text>}
              </View>
              <Text style={[
                styles.finalScoreValue,
                !isWinner && !isTie && styles.finalScoreValueWinner
              ]}>
                {opponentScore}
              </Text>
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.gameEndActions}>
            <Button
              variant="primary"
              onPress={handleRematch}
              disabled={isRequestingRematch}
              style={styles.actionButton}
              accessibilityLabel="Request rematch"
            >
              {isRequestingRematch ? 'Requesting...' : '🔄 Rematch'}
            </Button>
            
            <Button
              variant="secondary"
              onPress={handleReturnToDiscovery}
              style={styles.actionButton}
              accessibilityLabel="Return to discovery"
            >
              🏠 Discovery
            </Button>
          </View>
        </ScrollView>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.container, modalAnimatedStyle]}>
      {/* Confetti overlay - shown when user answers correctly */}
      {showConfetti && (
        <Animated.View style={[styles.confettiContainer, confettiAnimatedStyle]}>
          <ConfettiParticles />
        </Animated.View>
      )}

      {/* Reconnection indicator - shown when disconnected or reconnecting */}
      {(connectionStatus === 'disconnected' || connectionStatus === 'reconnecting' || isRecoveringState) && (
        <View style={styles.reconnectionBanner}>
          <View style={styles.reconnectionContent}>
            <Text style={styles.reconnectionIcon}>
              {connectionStatus === 'disconnected' ? '⚠️' : '🔄'}
            </Text>
            <Text style={styles.reconnectionText}>
              {isRecoveringState
                ? 'Syncing game state...'
                : connectionStatus === 'reconnecting'
                ? 'Reconnecting...'
                : 'Connection lost'}
            </Text>
          </View>
        </View>
      )}
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with round number and close button */}
        <View style={styles.header}>
          <Text style={styles.roundText}>
            Round {currentRound.roundNumber}/{activeGame.totalRounds}
          </Text>
          <TouchableOpacity
            onPress={handleClose}
            style={styles.closeButton}
            accessibilityRole="button"
            accessibilityLabel="Close game"
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Scores section */}
        <View style={styles.scoresContainer}>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreLabel}>You</Text>
            <Text style={styles.scoreValue}>{myScore}</Text>
            <View style={styles.scoreBar}>
              <ScoreBar score={myScore} maxScore={500} color={colors.accent.cyan} />
            </View>
          </View>

          <View style={styles.scoreItem}>
            <Text style={styles.scoreLabel}>Opponent</Text>
            <Text style={styles.scoreValue}>{opponentScore}</Text>
            <View style={styles.scoreBar}>
              <ScoreBar score={opponentScore} maxScore={500} color={colors.accent.magenta} />
            </View>
          </View>
        </View>

        {/* Question card */}
        <Card variant="elevated" padding={6} style={styles.questionCard}>
          <Text style={styles.questionText}>{currentRound.question}</Text>
        </Card>

        {/* Answer options */}
        <View style={styles.optionsContainer}>
          {currentRound.options.map((option, index) => (
            <AnswerOption
              key={index}
              option={option}
              index={index}
              selected={selectedAnswer === option}
              disabled={!!myAnswer || showFeedback}
              isCorrect={showFeedback && correctAnswer === option}
              isIncorrect={showFeedback && selectedAnswer === option && correctAnswer !== option}
              onPress={() => handleAnswerSelect(option)}
            />
          ))}
        </View>

        {/* Timer and chat toggle */}
        <View style={styles.footer}>
          <View style={styles.timerContainer}>
            <Text style={styles.timerIcon}>⏱️</Text>
            <Text style={styles.timerText}>
              {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleChatToggle}
            style={styles.chatButton}
            accessibilityRole="button"
            accessibilityLabel="Open chat"
          >
            <Text style={styles.chatButtonText}>💬</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Animated.View>
  );
}

/**
 * Score bar component with animated width
 * Memoized to prevent unnecessary re-renders (Requirement 15.4)
 */
const ScoreBar = React.memo(function ScoreBar({ score, maxScore, color }: { score: number; maxScore: number; color: string }) {
  const width = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    const percentage = Math.min((score / maxScore) * 100, 100);
    
    // Animate width change
    width.value = withSpring(percentage, springConfigs.default);
    
    // Add a pulse animation when score increases
    if (percentage > 0) {
      scale.value = withSequence(
        withSpring(1.05, springConfigs.bouncy),
        withSpring(1, springConfigs.default)
      );
    }
  }, [score, maxScore]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: scale.value }],
  }));

  return (
    <Animated.View style={[styles.scoreBarContainer, containerAnimatedStyle]}>
      <Animated.View
        style={[
          styles.scoreBarFill,
          { backgroundColor: color },
          animatedStyle,
        ]}
      />
    </Animated.View>
  );
});

/**
 * Answer option component with selection animation and feedback
 * Memoized to prevent unnecessary re-renders (Requirement 15.4)
 */
const AnswerOption = React.memo(function AnswerOption({
  option,
  index,
  selected,
  disabled,
  isCorrect,
  isIncorrect,
  onPress,
}: {
  option: string;
  index: number;
  selected: boolean;
  disabled: boolean;
  isCorrect?: boolean;
  isIncorrect?: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (selected && !isCorrect && !isIncorrect) {
      // Selection animation
      scale.value = withSpring(1.02, springConfigs.bouncy);
      glowOpacity.value = withTiming(1, timingConfigs.fast);
    } else if (isCorrect) {
      // Correct answer animation - green glow
      scale.value = withSpring(1.02, springConfigs.bouncy);
      glowOpacity.value = withTiming(1, timingConfigs.fast);
    } else if (isIncorrect) {
      // Incorrect answer animation - shake
      translateX.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
      glowOpacity.value = withTiming(1, timingConfigs.fast);
    } else {
      // Reset animation
      scale.value = withSpring(1, springConfigs.default);
      glowOpacity.value = withTiming(0, timingConfigs.fast);
      translateX.value = withTiming(0, timingConfigs.fast);
    }
  }, [selected, isCorrect, isIncorrect]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const optionLabels = ['A', 'B', 'C', 'D'];

  // Determine glow color based on feedback
  let glowColor: string = colors.accent.cyan;
  if (isCorrect) {
    glowColor = colors.status.success;
  } else if (isIncorrect) {
    glowColor = colors.status.error;
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={styles.optionButton}
      accessibilityRole="button"
      accessibilityLabel={`Option ${optionLabels[index]}: ${option}`}
      accessibilityState={{ selected, disabled }}
    >
      <Animated.View style={[styles.optionGlow, { backgroundColor: glowColor, shadowColor: glowColor }, glowStyle]} />
      <Animated.View style={[styles.optionContent, animatedStyle]}>
        <View style={[
          styles.optionLabelContainer,
          isCorrect && styles.optionLabelCorrect,
          isIncorrect && styles.optionLabelIncorrect,
        ]}>
          <Text style={styles.optionLabel}>{optionLabels[index]}</Text>
        </View>
        <Text style={styles.optionText}>{option}</Text>
        {isCorrect && <Text style={styles.feedbackIcon}>✓</Text>}
        {isIncorrect && <Text style={styles.feedbackIcon}>✗</Text>}
      </Animated.View>
    </TouchableOpacity>
  );
});

/**
 * Confetti particles component
 * Renders multiple confetti pieces with random positions
 * Memoized to prevent unnecessary re-renders (Requirement 15.4)
 */
const ConfettiParticles = React.memo(function ConfettiParticles() {
  const particles = Array.from({ length: 30 }, (_, i) => i);
  
  return (
    <>
      {particles.map((i) => (
        <ConfettiPiece key={i} index={i} />
      ))}
    </>
  );
});

/**
 * Individual confetti piece with random animation
 * Memoized to prevent unnecessary re-renders (Requirement 15.4)
 */
const ConfettiPiece = React.memo(function ConfettiPiece({ index }: { index: number }) {
  const { width, height } = useWindowDimensions();
  
  // Random initial position
  const startX = Math.random() * width;
  const startY = height * 0.3; // Start from top third
  
  // Random end position
  const endX = startX + (Math.random() - 0.5) * 200;
  const endY = height * 0.8 + Math.random() * 100;
  
  // Random color
  const confettiColors = ['#00ff88', '#ff0088', '#00ffff', '#ffff00', '#ff00ff'];
  const color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
  
  const translateX = useSharedValue(startX);
  const translateY = useSharedValue(startY);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(0);
  
  useEffect(() => {
    const delay = Math.random() * 200;
    
    // Fade in
    opacity.value = withDelay(delay, withTiming(1, { duration: 200 }));
    
    // Fall animation
    translateX.value = withDelay(
      delay,
      withTiming(endX, { duration: 1500, easing: Easing.out(Easing.quad) })
    );
    
    translateY.value = withDelay(
      delay,
      withTiming(endY, { duration: 1500, easing: Easing.in(Easing.quad) })
    );
    
    // Rotation
    rotation.value = withDelay(
      delay,
      withTiming(360 * (Math.random() > 0.5 ? 1 : -1), {
        duration: 1500,
        easing: Easing.linear,
      })
    );
    
    // Fade out at the end
    opacity.value = withDelay(
      delay + 1300,
      withTiming(0, { duration: 200 })
    );
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: 0,
    top: 0,
    width: 8,
    height: 8,
    backgroundColor: color,
    borderRadius: 2,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));
  
  return <Animated.View style={animatedStyle} />;
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    pointerEvents: 'none',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[4],
  },
  loadingText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.base,
    textAlign: 'center',
    marginTop: spacing[8],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  roundText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semibold,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.xl,
    lineHeight: 24,
  },
  scoresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[6],
    gap: spacing[4],
  },
  scoreItem: {
    flex: 1,
  },
  scoreLabel: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    marginBottom: spacing[1],
  },
  scoreValue: {
    color: colors.text.primary,
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    marginBottom: spacing[2],
  },
  scoreBar: {
    width: '100%',
  },
  scoreBarContainer: {
    height: 4,
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  questionCard: {
    marginBottom: spacing[6],
  },
  questionText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.medium,
    lineHeight: typography.lineHeight.relaxed,
    textAlign: 'center',
  },
  optionsContainer: {
    gap: spacing[3],
    marginBottom: spacing[6],
  },
  optionButton: {
    position: 'relative',
  },
  optionGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    backgroundColor: colors.accent.cyan,
    borderRadius: borderRadius.lg,
    shadowColor: colors.accent.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 5,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    borderWidth: 2,
    borderColor: colors.background.tertiary,
  },
  optionLabelContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  optionLabelCorrect: {
    backgroundColor: colors.status.success as string,
  },
  optionLabelIncorrect: {
    backgroundColor: colors.status.error as string,
  },
  optionLabel: {
    color: colors.text.primary,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
  },
  optionText: {
    flex: 1,
    color: colors.text.primary,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
  },
  feedbackIcon: {
    fontSize: typography.fontSize.xl,
    marginLeft: spacing[2],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing[4],
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  timerIcon: {
    fontSize: typography.fontSize.xl,
  },
  timerText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
  },
  chatButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.accent.cyan,
  },
  chatButtonText: {
    fontSize: typography.fontSize['2xl'],
  },
  winnerCard: {
    marginBottom: spacing[6],
    alignItems: 'center',
  },
  winnerEmoji: {
    fontSize: 64,
    marginBottom: spacing[4],
  },
  winnerText: {
    color: colors.text.primary,
    fontSize: typography.fontSize['3xl'],
    fontFamily: typography.fontFamily.bold,
    marginBottom: spacing[2],
  },
  winnerSubtext: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
  },
  finalScoresContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing[6],
    marginBottom: spacing[6],
  },
  finalScoresTitle: {
    color: colors.text.primary,
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.semibold,
    marginBottom: spacing[4],
    textAlign: 'center',
  },
  finalScoreItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[3],
  },
  finalScoreLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  finalScoreLabel: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.medium,
  },
  winnerBadge: {
    fontSize: typography.fontSize.xl,
  },
  finalScoreValue: {
    color: colors.text.primary,
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
  },
  finalScoreValueWinner: {
    color: colors.accent.cyan,
  },
  finalScoreDivider: {
    height: 1,
    backgroundColor: colors.background.tertiary,
    marginVertical: spacing[2],
  },
  gameEndActions: {
    gap: spacing[3],
  },
  actionButton: {
    width: '100%',
  },
  reconnectionBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.status.warning,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  reconnectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  },
  reconnectionIcon: {
    fontSize: typography.fontSize.lg,
  },
  reconnectionText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
  },
});
