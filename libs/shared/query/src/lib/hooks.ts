import { useQuery, UseQueryResult, useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { httpClient } from '@viby/shared/networking';
import { queryKeys } from './query-keys';

/**
 * Base query hooks for TanStack Query
 * 
 * These hooks provide:
 * - Type-safe data fetching
 * - Automatic caching and invalidation
 * - Polling support with foreground/background awareness
 * - Error handling and retry logic
 * 
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Custom hook to track app state (foreground/background)
 * 
 * @returns Current app state status
 */
function useAppState(): AppStateStatus {
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      setAppState(nextAppState);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return appState;
}

/**
 * User profile data
 */
export interface Profile {
  user: {
    id: string;
    email: string;
    username: string;
    avatar: string | null;
    spotifyLinked: boolean;
    deezerLinked: boolean;
    favoriteArtists: string[];
    createdAt: string;
    updatedAt: string;
  };
  stats: {
    totalMatches: number;
    totalGames: number;
    wins: number;
    losses: number;
    winRate: number;
  };
  musicStats: {
    topArtists: Array<{
      id: string;
      name: string;
      image: string | null;
      genres: string[];
    }>;
    topTracks: Array<{
      id: string;
      title: string;
      artist: string;
      album: string;
      artwork: string;
      duration: number;
      isrc: string | null;
      provider: 'spotify' | 'deezer';
    }>;
    topGenres: string[];
  };
  matchHistory: Array<{
    id: string;
    trackId: string;
    track: {
      id: string;
      title: string;
      artist: string;
      album: string;
      artwork: string;
      duration: number;
      isrc: string | null;
      provider: 'spotify' | 'deezer';
    };
    users: Array<{
      id: string;
      username: string;
      avatar: string | null;
    }>;
    status: 'pending' | 'accepted' | 'declined' | 'expired';
    createdAt: string;
    expiresAt: string;
  }>;
}

/**
 * Currently playing track data
 */
export interface CurrentlyPlaying {
  track: {
    id: string;
    title: string;
    artist: string;
    album: string;
    artwork: string;
    duration: number;
    isrc: string | null;
    provider: 'spotify' | 'deezer';
  } | null;
  isPlaying: boolean;
  progress: number;
  timestamp: string;
}

/**
 * Chat message data
 */
export interface Message {
  id: string;
  roomId: string;
  userId: string;
  username: string;
  avatar: string | null;
  content: string;
  status: 'sending' | 'sent' | 'failed';
  timestamp: string;
}

/**
 * Chat history response
 */
export interface ChatHistory {
  messages: Message[];
  hasMore: boolean;
  nextCursor: string | null;
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch user profile data
 * 
 * Features:
 * - 10-minute stale time (profiles don't change frequently)
 * - Automatic caching and deduplication
 * - Error handling with retry logic
 * 
 * @param userId - The user ID to fetch profile for
 * @returns Query result with profile data
 * 
 * @example
 * ```typescript
 * const { data: profile, isLoading, error } = useProfileQuery('user-123');
 * 
 * if (isLoading) return <Spinner />;
 * if (error) return <ErrorMessage error={error} />;
 * 
 * return <ProfileView profile={profile} />;
 * ```
 * 
 */
export function useProfileQuery(userId: string): UseQueryResult<Profile, Error> {
  return useQuery({
    queryKey: queryKeys.profile(userId),
    queryFn: async () => {
      const response = await httpClient.get<Profile>(`/api/profile/${userId}`);
      return response;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes - profiles don't change frequently
    enabled: !!userId, // Only fetch if userId is provided
  });
}

/**
 * Fetch currently playing track with automatic polling
 * 
 * Features:
 * - Polls every 5 seconds in foreground
 * - Polls every 30 seconds in background
 * - Automatic pause when app is inactive
 * - Handles network errors gracefully
 * 
 * @returns Query result with currently playing data
 * 
 * @example
 * ```typescript
 * const { data: currentlyPlaying, isLoading } = useCurrentlyPlayingQuery();
 * 
 * if (currentlyPlaying?.track) {
 *   return <NowPlayingCard track={currentlyPlaying.track} />;
 * }
 * 
 * return <NotListeningState />;
 * ```
 * 
 */
export function useCurrentlyPlayingQuery(): UseQueryResult<CurrentlyPlaying, Error> {
  const appState = useAppState();
  
  return useQuery({
    queryKey: queryKeys.currentlyPlaying(),
    queryFn: async () => {
      const response = await httpClient.get<CurrentlyPlaying>('/api/tracking/currently-playing');
      return response;
    },
    // Poll every 5 seconds in foreground, 30 seconds in background
    refetchInterval: appState === 'active' ? 5000 : 30000,
    // Continue polling in background
    refetchIntervalInBackground: true,
    // Keep data fresh
    staleTime: 0,
    // Don't cache for long since this changes frequently
    gcTime: 1000 * 60, // 1 minute
  });
}

/**
 * Fetch chat message history for a room
 * 
 * Features:
 * - 5-minute stale time (messages are mostly realtime via WebSocket)
 * - Pagination support via cursor
 * - Automatic caching per room
 * 
 * @param roomId - The chat room ID to fetch history for
 * @param limit - Maximum number of messages to fetch (default: 50)
 * @returns Query result with chat history
 * 
 * @example
 * ```typescript
 * const { data: history, isLoading, error } = useChatHistoryQuery('room-123');
 * 
 * if (isLoading) return <LoadingMessages />;
 * if (error) return <ErrorMessage error={error} />;
 * 
 * return (
 *   <MessageList
 *     messages={history.messages}
 *     onLoadMore={() => {
 *       // Load more with cursor
 *     }}
 *   />
 * );
 * ```
 * 
 */
export function useChatHistoryQuery(
  roomId: string,
  limit: number = 50
): UseQueryResult<ChatHistory, Error> {
  return useQuery({
    queryKey: queryKeys.chatHistory(roomId),
    queryFn: async () => {
      const response = await httpClient.get<ChatHistory>(
        `/api/chat/${roomId}/history`,
        {
          params: { limit },
        }
      );
      return response;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes - messages are mostly realtime
    enabled: !!roomId, // Only fetch if roomId is provided
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Profile update data
 */
export interface ProfileUpdateData {
  username?: string;
  avatar?: string | null;
  favoriteArtists?: string[];
}

/**
 * Message send data
 */
export interface MessageSendData {
  content: string;
}

/**
 * Update user profile with optimistic updates
 * 
 * Features:
 * - Optimistic UI updates for immediate feedback
 * - Automatic rollback on error
 * - Cache invalidation on success
 * - Type-safe update data
 * 
 * @param userId - The user ID whose profile to update
 * @returns Mutation result with mutate function
 * 
 * @example
 * ```typescript
 * const updateProfile = useUpdateProfileMutation('user-123');
 * 
 * const handleSave = () => {
 *   updateProfile.mutate(
 *     { username: 'newname' },
 *     {
 *       onSuccess: () => {
 *         showToast('Profile updated!');
 *       },
 *       onError: (error) => {
 *         showToast('Failed to update profile');
 *       },
 *     }
 *   );
 * };
 * ```
 * 
 */
export function useUpdateProfileMutation(
  userId: string
): UseMutationResult<Profile, Error, ProfileUpdateData, { previousProfile?: Profile }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: ProfileUpdateData) => {
      const response = await httpClient.patch<Profile>(
        `/api/profile/${userId}`,
        updates
      );
      return response;
    },

    // Optimistic update - apply changes immediately
    onMutate: async (updates) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.profile(userId) });

      // Snapshot the previous value
      const previousProfile = queryClient.getQueryData<Profile>(
        queryKeys.profile(userId)
      );

      // Optimistically update the cache
      if (previousProfile) {
        queryClient.setQueryData<Profile>(queryKeys.profile(userId), (old) => {
          if (!old) return old;

          return {
            ...old,
            user: {
              ...old.user,
              ...updates,
              updatedAt: new Date().toISOString(),
            },
          };
        });
      }

      // Return context with previous value for rollback
      return { previousProfile };
    },

    // Rollback on error
    onError: (error, updates, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(
          queryKeys.profile(userId),
          context.previousProfile
        );
      }
    },

    // Refetch to ensure consistency
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile(userId) });
    },
  });
}

/**
 * Send chat message with optimistic updates
 * 
 * Features:
 * - Optimistic message display with "sending" status
 * - Automatic status update on success/failure
 * - Temporary ID generation for optimistic messages
 * - Rollback on error
 * 
 * @param roomId - The chat room ID to send message to
 * @param currentUserId - The current user's ID
 * @param currentUsername - The current user's username
 * @param currentUserAvatar - The current user's avatar URL
 * @returns Mutation result with mutate function
 * 
 * @example
 * ```typescript
 * const sendMessage = useSendMessageMutation(
 *   'room-123',
 *   'user-123',
 *   'john_doe',
 *   'https://example.com/avatar.jpg'
 * );
 * 
 * const handleSend = (text: string) => {
 *   sendMessage.mutate(
 *     { content: text },
 *     {
 *       onSuccess: () => {
 *         clearInput();
 *       },
 *       onError: (error) => {
 *         showToast('Failed to send message');
 *       },
 *     }
 *   );
 * };
 * ```
 * 
 */
export function useSendMessageMutation(
  roomId: string,
  currentUserId: string,
  currentUsername: string,
  currentUserAvatar: string | null
): UseMutationResult<
  Message,
  Error,
  MessageSendData,
  { previousMessages?: Message[]; tempMessageId: string }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: MessageSendData) => {
      const response = await httpClient.post<Message>(
        `/api/chat/${roomId}/messages`,
        data
      );
      return response;
    },

    // Optimistic update - show message immediately
    onMutate: async (data) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.chatHistory(roomId),
      });

      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData<ChatHistory>(
        queryKeys.chatHistory(roomId)
      );

      // Generate temporary ID for optimistic message
      const tempMessageId = `temp-${Date.now()}-${Math.random()}`;

      // Create optimistic message
      const optimisticMessage: Message = {
        id: tempMessageId,
        roomId,
        userId: currentUserId,
        username: currentUsername,
        avatar: currentUserAvatar,
        content: data.content,
        status: 'sending',
        timestamp: new Date().toISOString(),
      };

      // Optimistically update the cache
      queryClient.setQueryData<ChatHistory>(
        queryKeys.chatHistory(roomId),
        (old) => {
          if (!old) {
            return {
              messages: [optimisticMessage],
              hasMore: false,
              nextCursor: null,
            };
          }

          return {
            ...old,
            messages: [...old.messages, optimisticMessage],
          };
        }
      );

      // Return context for rollback
      return {
        previousMessages: previousMessages?.messages,
        tempMessageId,
      };
    },

    // Update temp message with real message on success
    onSuccess: (realMessage, data, context) => {
      queryClient.setQueryData<ChatHistory>(
        queryKeys.chatHistory(roomId),
        (old) => {
          if (!old) return old;

          return {
            ...old,
            messages: old.messages.map((msg) =>
              msg.id === context.tempMessageId
                ? { ...realMessage, status: 'sent' as const }
                : msg
            ),
          };
        }
      );
    },

    // Rollback on error and mark message as failed
    onError: (error, data, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData<ChatHistory>(queryKeys.chatHistory(roomId), {
          messages: context.previousMessages,
          hasMore: false,
          nextCursor: null,
        });
      } else {
        // If no previous messages, mark the temp message as failed
        queryClient.setQueryData<ChatHistory>(
          queryKeys.chatHistory(roomId),
          (old) => {
            if (!old) return old;

            return {
              ...old,
              messages: old.messages.map((msg) =>
                msg.id === context?.tempMessageId
                  ? { ...msg, status: 'failed' as const }
                  : msg
              ),
            };
          }
        );
      }
    },

    // Refetch to ensure consistency
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.chatHistory(roomId),
      });
    },
  });
}
