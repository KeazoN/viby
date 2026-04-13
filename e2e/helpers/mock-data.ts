/**
 * Mock data for E2E tests
 */

export const mockUser = {
  id: 'test-user-1',
  email: 'test@viby.app',
  username: 'testuser',
  avatar: null,
  spotifyId: 'spotify-test-user',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockTrack = {
  id: 'track-1',
  title: 'Test Track',
  artist: 'Test Artist',
  album: 'Test Album',
  artwork: 'https://via.placeholder.com/300',
  duration: 180,
  isrc: null,
  provider: 'spotify' as const,
};

export const mockListener = {
  userId: 'listener-1',
  username: 'listener1',
  avatar: null,
  trackId: 'track-1',
  track: mockTrack,
  startedAt: new Date().toISOString(),
};

export const mockTrackCluster = {
  trackId: 'track-1',
  track: mockTrack,
  listenerCount: 5,
  listeners: [mockListener],
};

export const mockMatch = {
  id: 'match-1',
  userId1: 'test-user-1',
  userId2: 'matched-user-1',
  trackId: 'track-1',
  status: 'pending' as const,
  createdAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 30000).toISOString(),
};

export const mockMatchedUser = {
  id: 'matched-user-1',
  username: 'matcheduser',
  avatar: null,
  musicTasteMatch: 85,
};

export const mockGameSession = {
  id: 'game-1',
  roomId: 'room-1',
  player1Id: 'test-user-1',
  player2Id: 'matched-user-1',
  status: 'active' as const,
  currentRound: 1,
  totalRounds: 5,
  scores: {
    'test-user-1': 0,
    'matched-user-1': 0,
  },
  createdAt: new Date().toISOString(),
};

export const mockRound = {
  roundNumber: 1,
  question: 'What year was this song released?',
  options: ['2020', '2021', '2022', '2023'],
  correctAnswer: '2021',
  timeLimit: 15,
  track: mockTrack,
};

export const mockMessage = {
  id: 'message-1',
  roomId: 'room-1',
  userId: 'test-user-1',
  content: 'Hello!',
  status: 'sent' as const,
  timestamp: new Date().toISOString(),
};

export const mockChatRoom = {
  id: 'room-1',
  participant1Id: 'test-user-1',
  participant2Id: 'matched-user-1',
  messages: [mockMessage],
  createdAt: new Date().toISOString(),
};

export const mockProfile = {
  ...mockUser,
  matchHistory: [],
  musicStats: {
    topArtists: ['Artist 1', 'Artist 2', 'Artist 3'],
    topTracks: ['Track 1', 'Track 2', 'Track 3'],
    topGenres: ['Pop', 'Rock', 'Electronic'],
    totalMatches: 10,
    totalGames: 8,
    winRate: 0.625,
  },
};

export const mockNotification = {
  id: 'notification-1',
  type: 'match' as const,
  title: 'New Match!',
  body: 'You matched with matcheduser',
  data: {
    matchId: 'match-1',
    userId: 'matched-user-1',
  },
  timestamp: new Date().toISOString(),
};

/**
 * Generate multiple mock listeners
 */
export function generateMockListeners(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    userId: `listener-${i + 1}`,
    username: `listener${i + 1}`,
    avatar: null,
    trackId: `track-${(i % 3) + 1}`,
    track: {
      ...mockTrack,
      id: `track-${(i % 3) + 1}`,
      title: `Test Track ${(i % 3) + 1}`,
    },
    startedAt: new Date().toISOString(),
  }));
}

/**
 * Generate multiple mock track clusters
 */
export function generateMockTrackClusters(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    trackId: `track-${i + 1}`,
    track: {
      ...mockTrack,
      id: `track-${i + 1}`,
      title: `Test Track ${i + 1}`,
    },
    listenerCount: Math.floor(Math.random() * 10) + 1,
    listeners: [],
  }));
}

/**
 * Generate mock messages
 */
export function generateMockMessages(count: number, roomId: string) {
  return Array.from({ length: count }, (_, i) => ({
    id: `message-${i + 1}`,
    roomId,
    userId: i % 2 === 0 ? 'test-user-1' : 'matched-user-1',
    content: `Test message ${i + 1}`,
    status: 'sent' as const,
    timestamp: new Date(Date.now() - (count - i) * 60000).toISOString(),
  }));
}
