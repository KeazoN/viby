import { queryKeys, queryKeyPrefixes } from './query-keys';

describe('Query Keys', () => {
  describe('queryKeys', () => {
    it('should generate profile query key', () => {
      const userId = 'user-123';
      const key = queryKeys.profile(userId);

      expect(key).toEqual(['profile', userId]);
    });

    it('should generate matchHistory query key', () => {
      const userId = 'user-123';
      const key = queryKeys.matchHistory(userId);

      expect(key).toEqual(['matchHistory', userId]);
    });

    it('should generate musicStats query key', () => {
      const userId = 'user-123';
      const key = queryKeys.musicStats(userId);

      expect(key).toEqual(['musicStats', userId]);
    });

    it('should generate currentlyPlaying query key', () => {
      const key = queryKeys.currentlyPlaying();

      expect(key).toEqual(['currentlyPlaying']);
    });

    it('should generate listeners query key', () => {
      const key = queryKeys.listeners();

      expect(key).toEqual(['listeners']);
    });

    it('should generate trackClusters query key', () => {
      const key = queryKeys.trackClusters();

      expect(key).toEqual(['trackClusters']);
    });

    it('should generate chatHistory query key', () => {
      const roomId = 'room-123';
      const key = queryKeys.chatHistory(roomId);

      expect(key).toEqual(['chatHistory', roomId]);
    });

    it('should generate chatMessages query key', () => {
      const roomId = 'room-123';
      const key = queryKeys.chatMessages(roomId);

      expect(key).toEqual(['chatMessages', roomId]);
    });

    it('should generate gameSession query key', () => {
      const roomId = 'room-123';
      const key = queryKeys.gameSession(roomId);

      expect(key).toEqual(['gameSession', roomId]);
    });

    it('should generate gameHistory query key', () => {
      const userId = 'user-123';
      const key = queryKeys.gameHistory(userId);

      expect(key).toEqual(['gameHistory', userId]);
    });

    it('should generate matches query key', () => {
      const key = queryKeys.matches();

      expect(key).toEqual(['matches']);
    });

    it('should generate activeMatch query key', () => {
      const key = queryKeys.activeMatch();

      expect(key).toEqual(['activeMatch']);
    });
  });

  describe('queryKeyPrefixes', () => {
    it('should have profile prefixes', () => {
      expect(queryKeyPrefixes.profile).toEqual(['profile']);
    });

    it('should have discovery prefixes', () => {
      expect(queryKeyPrefixes.discovery).toEqual([
        'currentlyPlaying',
        'listeners',
        'trackClusters',
      ]);
    });

    it('should have chat prefixes', () => {
      expect(queryKeyPrefixes.chat).toEqual(['chatHistory', 'chatMessages']);
    });

    it('should have game prefixes', () => {
      expect(queryKeyPrefixes.game).toEqual(['gameSession', 'gameHistory']);
    });

    it('should have matchmaking prefixes', () => {
      expect(queryKeyPrefixes.matchmaking).toEqual(['matches', 'activeMatch']);
    });
  });

  describe('Type Safety', () => {
    it('should return readonly tuples for type safety', () => {
      const key = queryKeys.profile('user-123');
      
      // TypeScript should enforce readonly
      // @ts-expect-error - Cannot assign to readonly array
      key[0] = 'modified';
    });

    it('should maintain const assertion for query keys', () => {
      const key = queryKeys.currentlyPlaying();
      
      // Type should be readonly ['currentlyPlaying']
      type KeyType = typeof key;
      const expected: KeyType = ['currentlyPlaying'];
      
      expect(key).toEqual(expected);
    });
  });
});
