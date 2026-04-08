import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpClient } from '@viby/shared/networking';
import {
  useProfileQuery,
  useCurrentlyPlayingQuery,
  useChatHistoryQuery,
  useUpdateProfileMutation,
  useSendMessageMutation,
  type Profile,
  type CurrentlyPlaying,
  type ChatHistory,
  type Message,
} from './hooks';
import React, { ReactNode } from 'react';

// Mock dependencies
jest.mock('@viby/shared/networking');
jest.mock('react-native', () => ({
  AppState: {
    currentState: 'active',
    addEventListener: jest.fn(() => ({
      remove: jest.fn(),
    })),
  },
}));

const mockHttpClient = httpClient as jest.Mocked<typeof httpClient>;

// Helper to create wrapper with QueryClientProvider
const createWrapper = (queryClient: QueryClient) => {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('Query Hooks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    // Create a new QueryClient for each test to ensure isolation
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });

    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('useProfileQuery', () => {
    const mockProfile: Profile = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        avatar: 'https://example.com/avatar.jpg',
        spotifyLinked: true,
        deezerLinked: false,
        favoriteArtists: ['artist-1', 'artist-2'],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      stats: {
        totalMatches: 10,
        totalGames: 8,
        wins: 5,
        losses: 3,
        winRate: 0.625,
      },
      musicStats: {
        topArtists: [
          {
            id: 'artist-1',
            name: 'Test Artist',
            image: 'https://example.com/artist.jpg',
            genres: ['rock', 'indie'],
          },
        ],
        topTracks: [
          {
            id: 'track-1',
            title: 'Test Track',
            artist: 'Test Artist',
            album: 'Test Album',
            artwork: 'https://example.com/artwork.jpg',
            duration: 180000,
            isrc: 'USRC12345678',
            provider: 'spotify',
          },
        ],
        topGenres: ['rock', 'indie', 'pop'],
      },
      matchHistory: [],
    };

    it('should fetch profile data successfully', async () => {
      mockHttpClient.get.mockResolvedValueOnce(mockProfile);

      const { result } = renderHook(() => useProfileQuery('user-123'), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockProfile);
      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/profile/user-123');
    });

    it('should handle errors gracefully', async () => {
      const mockError = new Error('Failed to fetch profile');
      mockHttpClient.get.mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useProfileQuery('user-123'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(mockError);
    });

    it('should not fetch when userId is empty', () => {
      const { result } = renderHook(() => useProfileQuery(''), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current.isLoading).toBe(false);
      expect(mockHttpClient.get).not.toHaveBeenCalled();
    });
  });

  describe('useCurrentlyPlayingQuery', () => {
    const mockCurrentlyPlaying: CurrentlyPlaying = {
      track: {
        id: 'track-123',
        title: 'Test Song',
        artist: 'Test Artist',
        album: 'Test Album',
        artwork: 'https://example.com/artwork.jpg',
        duration: 180000,
        isrc: 'USRC12345678',
        provider: 'spotify',
      },
      isPlaying: true,
      progress: 45000,
      timestamp: '2024-01-01T12:00:00Z',
    };

    it('should fetch currently playing data successfully', async () => {
      mockHttpClient.get.mockResolvedValueOnce(mockCurrentlyPlaying);

      const { result } = renderHook(() => useCurrentlyPlayingQuery(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockCurrentlyPlaying);
      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/tracking/currently-playing');
    });

    it('should handle no track playing', async () => {
      const mockNoTrack: CurrentlyPlaying = {
        track: null,
        isPlaying: false,
        progress: 0,
        timestamp: '2024-01-01T12:00:00Z',
      };

      mockHttpClient.get.mockResolvedValueOnce(mockNoTrack);

      const { result } = renderHook(() => useCurrentlyPlayingQuery(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.track).toBeNull();
    });
  });

  describe('useChatHistoryQuery', () => {
    const mockChatHistory: ChatHistory = {
      messages: [
        {
          id: 'msg-1',
          roomId: 'room-123',
          userId: 'user-1',
          username: 'User One',
          avatar: 'https://example.com/avatar1.jpg',
          content: 'Hello!',
          status: 'sent',
          timestamp: '2024-01-01T12:00:00Z',
        },
      ],
      hasMore: false,
      nextCursor: null,
    };

    it('should fetch chat history successfully', async () => {
      mockHttpClient.get.mockResolvedValueOnce(mockChatHistory);

      const { result } = renderHook(() => useChatHistoryQuery('room-123'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockChatHistory);
      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/chat/room-123/history', {
        params: { limit: 50 },
      });
    });

    it('should use custom limit parameter', async () => {
      mockHttpClient.get.mockResolvedValueOnce(mockChatHistory);

      const { result } = renderHook(() => useChatHistoryQuery('room-123', 20), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/chat/room-123/history', {
        params: { limit: 20 },
      });
    });

    it('should not fetch when roomId is empty', () => {
      const { result } = renderHook(() => useChatHistoryQuery(''), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current.isLoading).toBe(false);
      expect(mockHttpClient.get).not.toHaveBeenCalled();
    });
  });

  describe('Mutation Hooks', () => {
    describe('useUpdateProfileMutation', () => {
      const mockProfile: Profile = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          username: 'testuser',
          avatar: 'https://example.com/avatar.jpg',
          spotifyLinked: true,
          deezerLinked: false,
          favoriteArtists: ['artist-1', 'artist-2'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        stats: {
          totalMatches: 10,
          totalGames: 8,
          wins: 5,
          losses: 3,
          winRate: 0.625,
        },
        musicStats: {
          topArtists: [],
          topTracks: [],
          topGenres: [],
        },
        matchHistory: [],
      };

      it('should update profile with optimistic update', async () => {
        // Pre-populate cache with existing profile
        queryClient.setQueryData(['profile', 'user-123'], mockProfile);

        const updatedProfile: Profile = {
          ...mockProfile,
          user: {
            ...mockProfile.user,
            username: 'newusername',
            updatedAt: '2024-01-02T00:00:00Z',
          },
        };

        mockHttpClient.patch.mockResolvedValueOnce(updatedProfile);

        const { result } = renderHook(() => useUpdateProfileMutation('user-123'), {
          wrapper: createWrapper(queryClient),
        });

        // Trigger mutation
        result.current.mutate({ username: 'newusername' });

        // Check optimistic update happened immediately
        await waitFor(() => {
          const cachedData = queryClient.getQueryData<Profile>(['profile', 'user-123']);
          expect(cachedData?.user.username).toBe('newusername');
        });

        // Wait for mutation to complete
        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(mockHttpClient.patch).toHaveBeenCalledWith('/api/profile/user-123', {
          username: 'newusername',
        });
      });

      it('should rollback on error', async () => {
        // Pre-populate cache with existing profile
        queryClient.setQueryData(['profile', 'user-123'], mockProfile);

        const mockError = new Error('Update failed');
        mockHttpClient.patch.mockRejectedValueOnce(mockError);

        const { result } = renderHook(() => useUpdateProfileMutation('user-123'), {
          wrapper: createWrapper(queryClient),
        });

        // Trigger mutation
        result.current.mutate({ username: 'newusername' });

        // Wait for mutation to fail
        await waitFor(() => expect(result.current.isError).toBe(true));

        // Check that cache was rolled back to original value
        const cachedData = queryClient.getQueryData<Profile>(['profile', 'user-123']);
        expect(cachedData?.user.username).toBe('testuser');
        expect(result.current.error).toEqual(mockError);
      });

      it('should handle multiple field updates', async () => {
        queryClient.setQueryData(['profile', 'user-123'], mockProfile);

        const updatedProfile: Profile = {
          ...mockProfile,
          user: {
            ...mockProfile.user,
            username: 'newusername',
            avatar: 'https://example.com/new-avatar.jpg',
            favoriteArtists: ['artist-3', 'artist-4'],
            updatedAt: '2024-01-02T00:00:00Z',
          },
        };

        mockHttpClient.patch.mockResolvedValueOnce(updatedProfile);

        const { result } = renderHook(() => useUpdateProfileMutation('user-123'), {
          wrapper: createWrapper(queryClient),
        });

        result.current.mutate({
          username: 'newusername',
          avatar: 'https://example.com/new-avatar.jpg',
          favoriteArtists: ['artist-3', 'artist-4'],
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(mockHttpClient.patch).toHaveBeenCalledWith('/api/profile/user-123', {
          username: 'newusername',
          avatar: 'https://example.com/new-avatar.jpg',
          favoriteArtists: ['artist-3', 'artist-4'],
        });
      });

      it('should invalidate cache after successful update', async () => {
        queryClient.setQueryData(['profile', 'user-123'], mockProfile);

        const updatedProfile: Profile = {
          ...mockProfile,
          user: {
            ...mockProfile.user,
            username: 'newusername',
          },
        };

        mockHttpClient.patch.mockResolvedValueOnce(updatedProfile);

        const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

        const { result } = renderHook(() => useUpdateProfileMutation('user-123'), {
          wrapper: createWrapper(queryClient),
        });

        result.current.mutate({ username: 'newusername' });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(invalidateSpy).toHaveBeenCalledWith({
          queryKey: ['profile', 'user-123'],
        });
      });
    });

    describe('useSendMessageMutation', () => {
      const mockChatHistory: ChatHistory = {
        messages: [
          {
            id: 'msg-1',
            roomId: 'room-123',
            userId: 'user-1',
            username: 'User One',
            avatar: 'https://example.com/avatar1.jpg',
            content: 'Hello!',
            status: 'sent',
            timestamp: '2024-01-01T12:00:00Z',
          },
        ],
        hasMore: false,
        nextCursor: null,
      };

      it('should send message with optimistic update', async () => {
        // Pre-populate cache with existing messages
        queryClient.setQueryData(['chatHistory', 'room-123'], mockChatHistory);

        const newMessage: Message = {
          id: 'msg-2',
          roomId: 'room-123',
          userId: 'user-2',
          username: 'User Two',
          avatar: 'https://example.com/avatar2.jpg',
          content: 'Hi there!',
          status: 'sent',
          timestamp: '2024-01-01T12:01:00Z',
        };

        mockHttpClient.post.mockResolvedValueOnce(newMessage);

        const { result } = renderHook(
          () =>
            useSendMessageMutation(
              'room-123',
              'user-2',
              'User Two',
              'https://example.com/avatar2.jpg'
            ),
          {
            wrapper: createWrapper(queryClient),
          }
        );

        // Trigger mutation
        result.current.mutate({ content: 'Hi there!' });

        // Check optimistic update happened immediately
        await waitFor(() => {
          const cachedData = queryClient.getQueryData<ChatHistory>([
            'chatHistory',
            'room-123',
          ]);
          expect(cachedData?.messages).toHaveLength(2);
          expect(cachedData?.messages[1].content).toBe('Hi there!');
          expect(cachedData?.messages[1].status).toBe('sending');
        });

        // Wait for mutation to complete
        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        // Check that temp message was replaced with real message
        const finalData = queryClient.getQueryData<ChatHistory>([
          'chatHistory',
          'room-123',
        ]);
        expect(finalData?.messages[1].id).toBe('msg-2');
        expect(finalData?.messages[1].status).toBe('sent');

        expect(mockHttpClient.post).toHaveBeenCalledWith('/api/chat/room-123/messages', {
          content: 'Hi there!',
        });
      });

      it('should rollback on error', async () => {
        queryClient.setQueryData(['chatHistory', 'room-123'], mockChatHistory);

        const mockError = new Error('Send failed');
        mockHttpClient.post.mockRejectedValueOnce(mockError);

        const { result } = renderHook(
          () =>
            useSendMessageMutation(
              'room-123',
              'user-2',
              'User Two',
              'https://example.com/avatar2.jpg'
            ),
          {
            wrapper: createWrapper(queryClient),
          }
        );

        result.current.mutate({ content: 'Hi there!' });

        // Wait for mutation to fail
        await waitFor(() => expect(result.current.isError).toBe(true));

        // Check that cache was rolled back to original value
        const cachedData = queryClient.getQueryData<ChatHistory>([
          'chatHistory',
          'room-123',
        ]);
        expect(cachedData?.messages).toHaveLength(1);
        expect(cachedData?.messages[0].id).toBe('msg-1');
        expect(result.current.error).toEqual(mockError);
      });

      it('should handle sending to empty chat', async () => {
        // No pre-existing messages
        const newMessage: Message = {
          id: 'msg-1',
          roomId: 'room-456',
          userId: 'user-1',
          username: 'User One',
          avatar: 'https://example.com/avatar1.jpg',
          content: 'First message!',
          status: 'sent',
          timestamp: '2024-01-01T12:00:00Z',
        };

        mockHttpClient.post.mockResolvedValueOnce(newMessage);

        const { result } = renderHook(
          () =>
            useSendMessageMutation(
              'room-456',
              'user-1',
              'User One',
              'https://example.com/avatar1.jpg'
            ),
          {
            wrapper: createWrapper(queryClient),
          }
        );

        result.current.mutate({ content: 'First message!' });

        // Check optimistic update created new chat history
        await waitFor(() => {
          const cachedData = queryClient.getQueryData<ChatHistory>([
            'chatHistory',
            'room-456',
          ]);
          expect(cachedData?.messages).toHaveLength(1);
          expect(cachedData?.messages[0].content).toBe('First message!');
          expect(cachedData?.messages[0].status).toBe('sending');
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        const finalData = queryClient.getQueryData<ChatHistory>([
          'chatHistory',
          'room-456',
        ]);
        expect(finalData?.messages[0].id).toBe('msg-1');
        expect(finalData?.messages[0].status).toBe('sent');
      });

      it('should generate unique temp message IDs', async () => {
        queryClient.setQueryData(['chatHistory', 'room-123'], mockChatHistory);

        mockHttpClient.post.mockResolvedValue({
          id: 'msg-real',
          roomId: 'room-123',
          userId: 'user-2',
          username: 'User Two',
          avatar: null,
          content: 'Test',
          status: 'sent',
          timestamp: '2024-01-01T12:01:00Z',
        });

        const { result } = renderHook(
          () => useSendMessageMutation('room-123', 'user-2', 'User Two', null),
          {
            wrapper: createWrapper(queryClient),
          }
        );

        // Send two messages quickly
        result.current.mutate({ content: 'Message 1' });
        result.current.mutate({ content: 'Message 2' });

        // Check that both messages have unique temp IDs
        await waitFor(() => {
          const cachedData = queryClient.getQueryData<ChatHistory>([
            'chatHistory',
            'room-123',
          ]);
          const tempMessages = cachedData?.messages.filter((m) =>
            m.id.startsWith('temp-')
          );
          if (tempMessages && tempMessages.length >= 2) {
            expect(tempMessages[0].id).not.toBe(tempMessages[1].id);
          }
        });
      });

      it('should invalidate cache after successful send', async () => {
        queryClient.setQueryData(['chatHistory', 'room-123'], mockChatHistory);

        const newMessage: Message = {
          id: 'msg-2',
          roomId: 'room-123',
          userId: 'user-2',
          username: 'User Two',
          avatar: null,
          content: 'Test',
          status: 'sent',
          timestamp: '2024-01-01T12:01:00Z',
        };

        mockHttpClient.post.mockResolvedValueOnce(newMessage);

        const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

        const { result } = renderHook(
          () => useSendMessageMutation('room-123', 'user-2', 'User Two', null),
          {
            wrapper: createWrapper(queryClient),
          }
        );

        result.current.mutate({ content: 'Test' });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(invalidateSpy).toHaveBeenCalledWith({
          queryKey: ['chatHistory', 'room-123'],
        });
      });
    });
  });
});
