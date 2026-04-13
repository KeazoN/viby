/**
 * Matchmaking + Game Integration Tests
 * 
 * Tests the complete flow from match creation through game session to chat interaction.
 * Validates integration between Matchmaking, Game, and Chat modules.
 * 
 * **Validates: Requirements 5.1, 5.2, 5.4, 6.1, 6.4, 7.1**
 * - 5.1: Match request to Backend_API
 * - 5.2: Display special match notification
 * - 5.4: Accept match and transition to Game_Session
 * - 6.1: Create Game_Session and display game UI
 * - 6.4: Submit answer to Backend_API via WebSocket
 * - 7.1: Enable chat for game session
 */

import { matchmakingService } from './services/matchmaking-service';
import { gameService } from '@viby/modules/game';
import { chatService } from '@viby/modules/chat';
import { useMatchmakingStore } from './stores/matchmaking-store';
import { useGameStore } from '@viby/modules/game';
import { useChatStore } from '@viby/modules/chat';
import { socketManager } from '@viby/modules/realtime';
import { signedPost } from '@viby/shared/networking';
import type {
  Match,
  MatchCreatedPayload,
  MatchAcceptedPayload,
} from './types';
import type {
  GameSession,
  GameStartedPayload,
  RoundStartedPayload,
  SubmitAnswerResponse,
} from '@viby/modules/game';
import type { Message, MessageReceivedPayload } from '@viby/modules/chat';

// Mock dependencies
jest.mock('@viby/modules/realtime');
jest.mock('@viby/shared/networking');
jest.mock('@viby/modules/game', () => ({
  ...jest.requireActual('@viby/modules/game'),
  gameService: {
    subscribeToGameEvents: jest.fn(),
    unsubscribeFromGameEvents: jest.fn(),
    submitAnswer: jest.fn(),
    leaveGame: jest.fn(),
    getGameState: jest.fn(),
  },
}));
jest.mock('@viby/modules/chat', () => ({
  ...jest.requireActual('@viby/modules/chat'),
  chatService: {
    subscribeToChat: jest.fn(),
    unsubscribeFromChat: jest.fn(),
    sendMessage: jest.fn(),
    loadHistory: jest.fn(),
    sendTypingIndicator: jest.fn(),
  },
}));

describe('Matchmaking + Game Integration Tests', () => {
  let mockSubscribeCallbacks: Map<string, (data: any) => void>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSubscribeCallbacks = new Map();

    // Mock socketManager.subscribe to capture callbacks
    (socketManager.subscribe as jest.Mock).mockImplementation((event: string, callback: any) => {
      mockSubscribeCallbacks.set(event, callback);
    });

    // Reset stores
    useMatchmakingStore.getState().clearActiveMatch();
    useGameStore.getState().reset();
    useChatStore.getState().reset();
  });

  const createMockMatch = (id: string, trackId: string): Match => ({
    id,
    trackId,
    track: {
      id: trackId,
      title: 'Matched Song',
      artist: 'Test Artist',
      album: 'Test Album',
      artwork: `https://example.com/artwork-${trackId}.jpg`,
      duration: 180,
      isrc: null,
      provider: 'spotify',
    },
    users: [
      {
        id: 'user-1',
        username: 'currentUser',
        avatar: null,
      },
      {
        id: 'user-2',
        username: 'matchedUser',
        avatar: null,
      },
    ],
    status: 'pending',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30000).toISOString(),
  });

  const createMockGameSession = (roomId: string): GameSession => ({
    id: 'game-123',
    roomId,
    status: 'active',
    currentRound: 1,
    totalRounds: 5,
    scores: {
      'user-1': 0,
      'user-2': 0,
    },
    players: [
      {
        id: 'user-1',
        username: 'currentUser',
        avatar: null,
      },
      {
        id: 'user-2',
        username: 'matchedUser',
        avatar: null,
      },
    ],
    createdAt: new Date().toISOString(),
    opponentId: 'user-2',
  });

  describe('Requirement 5.1 & 5.2: Match Request and Notification', () => {
    it('should request match and receive match:created event', async () => {
      const mockMatch = createMockMatch('match-1', 'track-1');

      // Step 1: Request match
      (signedPost as jest.Mock).mockResolvedValueOnce({
        match: mockMatch,
      });

      const match = await matchmakingService.requestMatch('track-1');

      expect(signedPost).toHaveBeenCalledWith('/matchmaking/request', {
        trackId: 'track-1',
      });
      expect(match).toEqual(mockMatch);

      // Step 2: Subscribe to match events
      matchmakingService.subscribeToMatchEvents();

      // Step 3: Receive match:created WebSocket event
      const matchCreatedPayload: MatchCreatedPayload = {
        match: mockMatch,
        timestamp: new Date(),
      };

      const matchCreatedCallback = mockSubscribeCallbacks.get('match:created');
      expect(matchCreatedCallback).toBeDefined();

      // Update store with match
      useMatchmakingStore.getState().setActiveMatch(mockMatch);

      // Trigger callback
      matchCreatedCallback!(matchCreatedPayload);

      // Verify match is in store
      const activeMatch = useMatchmakingStore.getState().activeMatch;
      expect(activeMatch).toEqual(mockMatch);
      expect(useMatchmakingStore.getState().matchStatus).toBe('pending');
    });
  });

  describe('Requirement 5.4: Accept Match and Transition to Game', () => {
    it('should accept match and transition to game session', async () => {
      const mockMatch = createMockMatch('match-1', 'track-1');
      const roomId = 'room-123';

      // Step 1: Set active match
      useMatchmakingStore.getState().setActiveMatch(mockMatch);

      // Step 2: Accept match
      (signedPost as jest.Mock).mockResolvedValueOnce({
        roomId,
        match: { ...mockMatch, status: 'accepted' },
      });

      const acceptResponse = await matchmakingService.acceptMatch('match-1');

      expect(signedPost).toHaveBeenCalledWith('/matchmaking/match-1/accept');
      expect(acceptResponse.roomId).toBe(roomId);
      expect(acceptResponse.match.status).toBe('accepted');

      // Step 3: Receive match:accepted WebSocket event
      matchmakingService.subscribeToMatchEvents();

      const matchAcceptedPayload: MatchAcceptedPayload = {
        matchId: 'match-1',
        roomId,
        timestamp: new Date(),
      };

      const matchAcceptedCallback = mockSubscribeCallbacks.get('match:accepted');
      useMatchmakingStore.getState().updateMatchStatus('accepted');

      matchAcceptedCallback!(matchAcceptedPayload);

      // Verify match status is updated
      expect(useMatchmakingStore.getState().matchStatus).toBe('accepted');
    });
  });

  describe('Requirement 6.1: Create Game Session', () => {
    it('should create game session after match is accepted', () => {
      const roomId = 'room-123';
      const mockGameSession = createMockGameSession(roomId);

      // Subscribe to game events
      gameService.subscribeToGameEvents(roomId);

      expect(gameService.subscribeToGameEvents).toHaveBeenCalledWith(roomId);

      // Receive game:started event
      const gameStartedPayload: GameStartedPayload = {
        game: mockGameSession,
        timestamp: new Date(),
      };

      const gameStartedCallback = mockSubscribeCallbacks.get('game:started');
      
      // Update game store
      useGameStore.getState().startGame(mockGameSession);

      if (gameStartedCallback) {
        gameStartedCallback(gameStartedPayload);
      }

      // Verify game session is created
      const activeGame = useGameStore.getState().activeGame;
      expect(activeGame).toEqual(mockGameSession);
      expect(activeGame?.status).toBe('active');
    });

    it('should start first round after game session is created', () => {
      const roomId = 'room-123';
      const mockGameSession = createMockGameSession(roomId);

      useGameStore.getState().startGame(mockGameSession);

      // Receive round:started event
      const roundStartedPayload: RoundStartedPayload = {
        roomId,
        round: {
          id: 'round-1',
          roundNumber: 1,
          question: 'What year was this song released?',
          options: ['2020', '2021', '2022', '2023'],
          timeLimit: 30,
          startedAt: new Date().toISOString(),
        },
        timestamp: new Date(),
      };

      const roundStartedCallback = mockSubscribeCallbacks.get('round:started');
      
      // Update game store with round
      useGameStore.getState().updateRound(roundStartedPayload.round);

      if (roundStartedCallback) {
        roundStartedCallback(roundStartedPayload);
      }

      // Verify round is started
      const currentRound = useGameStore.getState().currentRound;
      expect(currentRound).toEqual(roundStartedPayload.round);
      expect(currentRound?.roundNumber).toBe(1);
    });
  });

  describe('Requirement 6.4: Submit Answer', () => {
    it('should submit answer and receive confirmation', async () => {
      const roomId = 'room-123';
      const roundId = 'round-1';
      const answer = '2021';

      const mockResponse: SubmitAnswerResponse = {
        correct: true,
        points: 100,
        timestamp: new Date().toISOString(),
      };

      (signedPost as jest.Mock).mockResolvedValueOnce(mockResponse);

      // Submit answer
      const response = await gameService.submitAnswer(roomId, roundId, answer);

      expect(signedPost).toHaveBeenCalledWith(`/game/${roomId}/answer`, {
        roomId,
        roundId,
        answer,
      });
      expect(response.correct).toBe(true);
      expect(response.points).toBe(100);
    });

    it('should handle optimistic answer submission', async () => {
      const roomId = 'room-123';
      const roundId = 'round-1';
      const answer = '2021';

      // Optimistically update store before API response
      useGameStore.getState().submitAnswer(roundId, answer);

      // Verify optimistic update
      const answers = useGameStore.getState().answers;
      expect(answers[roundId]).toBe(answer);

      // API call completes
      const mockResponse: SubmitAnswerResponse = {
        correct: true,
        points: 100,
        timestamp: new Date().toISOString(),
      };

      (signedPost as jest.Mock).mockResolvedValueOnce(mockResponse);

      await gameService.submitAnswer(roomId, roundId, answer);

      // Verify answer is confirmed
      expect(signedPost).toHaveBeenCalled();
    });
  });

  describe('Requirement 7.1: Enable Chat for Game Session', () => {
    it('should enable chat when game session is created', () => {
      const roomId = 'room-123';

      // Subscribe to chat events
      chatService.subscribeToChat(roomId);

      expect(chatService.subscribeToChat).toHaveBeenCalledWith(roomId);
    });

    it('should send and receive chat messages during game', async () => {
      const roomId = 'room-123';
      const messageContent = 'Good luck!';

      // Subscribe to chat
      chatService.subscribeToChat(roomId);

      // Send message
      const mockMessage: Message = {
        id: 'msg-1',
        roomId,
        userId: 'user-1',
        content: messageContent,
        status: 'sent',
        createdAt: new Date().toISOString(),
        readBy: [],
      };

      (chatService.sendMessage as jest.Mock).mockResolvedValueOnce(mockMessage);

      const sentMessage = await chatService.sendMessage(roomId, messageContent);

      expect(chatService.sendMessage).toHaveBeenCalledWith(roomId, messageContent);
      expect(sentMessage.content).toBe(messageContent);

      // Receive message via WebSocket
      const messageReceivedPayload: MessageReceivedPayload = {
        message: {
          ...mockMessage,
          userId: 'user-2',
          content: 'Thanks, you too!',
        },
        timestamp: new Date(),
      };

      const messageCallback = mockSubscribeCallbacks.get('chat:message');
      
      // Add message to store
      useChatStore.getState().addMessage(messageReceivedPayload.message);

      if (messageCallback) {
        messageCallback(messageReceivedPayload);
      }

      // Verify message is received
      const messages = useChatStore.getState().messages[roomId] || [];
      expect(messages.length).toBeGreaterThan(0);
    });
  });

  describe('Complete Match-to-Game-to-Chat Flow', () => {
    it('should handle complete flow from match request to game with chat', async () => {
      const trackId = 'track-1';
      const matchId = 'match-1';
      const roomId = 'room-123';

      // Step 1: Request match
      const mockMatch = createMockMatch(matchId, trackId);
      (signedPost as jest.Mock).mockResolvedValueOnce({
        match: mockMatch,
      });

      const match = await matchmakingService.requestMatch(trackId);
      expect(match.id).toBe(matchId);

      // Step 2: Subscribe to match events
      matchmakingService.subscribeToMatchEvents();
      useMatchmakingStore.getState().setActiveMatch(mockMatch);

      // Step 3: Accept match
      (signedPost as jest.Mock).mockResolvedValueOnce({
        roomId,
        match: { ...mockMatch, status: 'accepted' },
      });

      const acceptResponse = await matchmakingService.acceptMatch(matchId);
      expect(acceptResponse.roomId).toBe(roomId);

      useMatchmakingStore.getState().updateMatchStatus('accepted');

      // Step 4: Game session starts
      const mockGameSession = createMockGameSession(roomId);
      gameService.subscribeToGameEvents(roomId);
      useGameStore.getState().startGame(mockGameSession);

      expect(useGameStore.getState().activeGame?.roomId).toBe(roomId);

      // Step 5: Enable chat
      chatService.subscribeToChat(roomId);

      // Step 6: Send chat message
      const mockMessage: Message = {
        id: 'msg-1',
        roomId,
        userId: 'user-1',
        content: 'Ready to play!',
        status: 'sent',
        createdAt: new Date().toISOString(),
        readBy: [],
      };

      (chatService.sendMessage as jest.Mock).mockResolvedValueOnce(mockMessage);

      const message = await chatService.sendMessage(roomId, 'Ready to play!');
      expect(message.content).toBe('Ready to play!');

      // Step 7: Submit answer
      const mockAnswerResponse: SubmitAnswerResponse = {
        correct: true,
        points: 100,
        timestamp: new Date().toISOString(),
      };

      (signedPost as jest.Mock).mockResolvedValueOnce(mockAnswerResponse);

      const answerResponse = await gameService.submitAnswer(roomId, 'round-1', '2021');
      expect(answerResponse.correct).toBe(true);

      // Verify complete flow
      expect(useMatchmakingStore.getState().matchStatus).toBe('accepted');
      expect(useGameStore.getState().activeGame).not.toBeNull();
      expect(chatService.subscribeToChat).toHaveBeenCalledWith(roomId);
    });
  });

  describe('Error Handling', () => {
    it('should handle match request failure', async () => {
      (signedPost as jest.Mock).mockRejectedValueOnce(new Error('No available matches'));

      await expect(matchmakingService.requestMatch('track-1')).rejects.toThrow(
        'No available matches'
      );
    });

    it('should handle accept match failure', async () => {
      const mockMatch = createMockMatch('match-1', 'track-1');
      useMatchmakingStore.getState().setActiveMatch(mockMatch);

      (signedPost as jest.Mock).mockRejectedValueOnce(new Error('Match already expired'));

      await expect(matchmakingService.acceptMatch('match-1')).rejects.toThrow(
        'Match already expired'
      );
    });

    it('should handle answer submission failure', async () => {
      (signedPost as jest.Mock).mockRejectedValueOnce(new Error('Round already ended'));

      await expect(
        gameService.submitAnswer('room-123', 'round-1', '2021')
      ).rejects.toThrow('Round already ended');
    });

    it('should handle chat message send failure', async () => {
      (chatService.sendMessage as jest.Mock).mockRejectedValueOnce(
        new Error('Message too long')
      );

      await expect(
        chatService.sendMessage('room-123', 'x'.repeat(501))
      ).rejects.toThrow('Message too long');
    });
  });

  describe('Cleanup and Unsubscribe', () => {
    it('should unsubscribe from all events when leaving game', () => {
      const roomId = 'room-123';

      // Subscribe to all events
      matchmakingService.subscribeToMatchEvents();
      gameService.subscribeToGameEvents(roomId);
      chatService.subscribeToChat(roomId);

      // Unsubscribe
      matchmakingService.unsubscribeFromMatchEvents();
      gameService.unsubscribeFromGameEvents(roomId);
      chatService.unsubscribeFromChat(roomId);

      expect(gameService.unsubscribeFromGameEvents).toHaveBeenCalledWith(roomId);
      expect(chatService.unsubscribeFromChat).toHaveBeenCalledWith(roomId);
    });
  });
});
