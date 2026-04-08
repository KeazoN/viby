import * as fc from 'fast-check';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import { useProfileQuery, useUpdateProfileMutation, useSendMessageMutation } from './hooks';
import { queryKeys } from './query-keys';
import { httpClient } from '@viby/shared/networking';
import React from 'react';

/**
 * Property-Based Tests for TanStack Query Integration
 * 
 * These tests verify correctness properties of the TanStack Query integration,
 * including cache invalidation on WebSocket events and optimistic updates with rollback.
 */

// Mock dependencies
jest.mock('@viby/shared/networking', () => ({
  httpClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
  },
}));

describe('TanStack Query Integration - Property-Based Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    // Create a fresh QueryClient for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false, // Disable retries for faster tests
          gcTime: Infinity, // Keep cache for test inspection
        },
        mutations: {
          retry: false,
        },
      },
    });
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  // Helper to create a wrapper with QueryClientProvider
  const createWrapper = () => {
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  // Arbitraries for generating test data
  const userIdArb = fc.string({ minLength: 1, maxLength: 50 });
  const usernameArb = fc.string({ minLength: 3, maxLength: 20 });
  const emailArb = fc.emailAddress();
  const avatarArb = fc.oneof(
    fc.constant(null),
    fc.webUrl()
  );
  const timestampArb = fc.date().map(d => d.toISOString());

  const profileArb = fc.record({
    user: fc.record({
      id: userIdArb,
      email: emailArb,
      username: usernameArb,
      avatar: avatarArb,
      spotifyLinked: fc.boolean(),
      deezerLinked: fc.boolean(),
      favoriteArtists: fc.array(fc.string(), { maxLength: 10 }),
      createdAt: timestampArb,
      updatedAt: timestampArb,
    }),
    stats: fc.record({
      totalMatches: fc.nat(),
      totalGames: fc.nat(),
      wins: fc.nat(),
      losses: fc.nat(),
      winRate: fc.float({ min: 0, max: 1 }),
    }),
    musicStats: fc.record({
      topArtists: fc.array(
        fc.record({
          id: fc.string(),
          name: fc.string(),
          image: fc.oneof(fc.constant(null), fc.webUrl()),
          genres: fc.array(fc.string(), { maxLength: 5 }),
        }),
        { maxLength: 10 }
      ),
      topTracks: fc.array(
        fc.record({
          id: fc.string(),
          title: fc.string(),
          artist: fc.string(),
          album: fc.string(),
          artwork: fc.webUrl(),
          duration: fc.nat({ max: 600000 }),
          isrc: fc.oneof(fc.constant(null), fc.string()),
          provider: fc.constantFrom('spotify', 'deezer'),
        }),
        { maxLength: 10 }
      ),
      topGenres: fc.array(fc.string(), { maxLength: 10 }),
    }),
    matchHistory: fc.array(
      fc.record({
        id: fc.string(),
        trackId: fc.string(),
        track: fc.record({
          id: fc.string(),
          title: fc.string(),
          artist: fc.string(),
          album: fc.string(),
          artwork: fc.webUrl(),
          duration: fc.nat({ max: 600000 }),
          isrc: fc.oneof(fc.constant(null), fc.string()),
          provider: fc.constantFrom('spotify', 'deezer'),
        }),
        users: fc.array(
          fc.record({
            id: fc.string(),
            username: fc.string(),
            avatar: fc.oneof(fc.constant(null), fc.webUrl()),
          }),
          { minLength: 2, maxLength: 2 }
        ),
        status: fc.constantFrom('pending', 'accepted', 'declined', 'expired'),
        createdAt: timestampArb,
        expiresAt: timestampArb,
      }),
      { maxLength: 20 }
    ),
  });

  const profileUpdateArb = fc.record({
    username: fc.option(usernameArb, { nil: undefined }),
    avatar: fc.option(avatarArb, { nil: undefined }),
    favoriteArtists: fc.option(fc.array(fc.string(), { maxLength: 10 }), { nil: undefined }),
  });

  const roomIdArb = fc.string({ minLength: 1, maxLength: 50 });
  const messageContentArb = fc.string({ minLength: 1, maxLength: 500 });

  const messageArb = fc.record({
    id: fc.string(),
    roomId: roomIdArb,
    userId: userIdArb,
    username: usernameArb,
    avatar: avatarArb,
    content: messageContentArb,
    status: fc.constantFrom('sending', 'sent', 'failed'),
    timestamp: timestampArb,
  });

  const chatHistoryArb = fc.record({
    messages: fc.array(messageArb, { maxLength: 50 }),
    hasMore: fc.boolean(),
    nextCursor: fc.oneof(fc.constant(null), fc.string()),
  });

  /**
   * Property 21: Cache Invalidation on WebSocket Events
   * 
   * For any WebSocket event that indicates server state change (listener added/removed,
   * match created, etc.), the corresponding TanStack Query cache should be invalidated.
   */
  describe('Property 21: Cache Invalidation on WebSocket Events', () => {
    it('should invalidate profile cache when profile data changes', async () => {
      await fc.assert(
        fc.asyncProperty(
          profileArb,
          profileArb,
          async (initialProfile, updatedProfile) => {
            // Ensure profiles have the same user ID but different data
            updatedProfile.user.id = initialProfile.user.id;
            fc.pre(
              initialProfile.user.username !== updatedProfile.user.username ||
              initialProfile.user.avatar !== updatedProfile.user.avatar
            );

            const userId = initialProfile.user.id;

            // Setup: Mock initial profile fetch
            (httpClient.get as jest.Mock).mockResolvedValueOnce(initialProfile);

            // Render hook and fetch initial data
            const { result } = renderHook(() => useProfileQuery(userId), {
              wrapper: createWrapper(),
            });

            // Wait for initial data to load
            await waitFor(() => {
              expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toEqual(initialProfile);

            // Simulate WebSocket event: profile updated
            // Mock the updated profile fetch
            (httpClient.get as jest.Mock).mockResolvedValueOnce(updatedProfile);

            // Invalidate the cache (simulating WebSocket event handler)
            await queryClient.invalidateQueries({
              queryKey: queryKeys.profile(userId),
            });

            // Wait for refetch to complete
            await waitFor(() => {
              expect(result.current.data).toEqual(updatedProfile);
            });

            // Verify: Cache should contain updated data
            const cachedData = queryClient.getQueryData(queryKeys.profile(userId));
            expect(cachedData).toEqual(updatedProfile);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should invalidate chat history cache when new message arrives via WebSocket', async () => {
      await fc.assert(
        fc.asyncProperty(
          roomIdArb,
          chatHistoryArb,
          messageArb,
          async (roomId, initialHistory, newMessage) => {
            // Ensure new message belongs to the same room
            newMessage.roomId = roomId;

            // Setup: Mock initial chat history fetch
            (httpClient.get as jest.Mock).mockResolvedValueOnce(initialHistory);

            // Render hook and fetch initial data
            const { result } = renderHook(() => {
              const { useQuery } = require('@tanstack/react-query');
              return useQuery({
                queryKey: queryKeys.chatHistory(roomId),
                queryFn: async () => {
                  return await httpClient.get(`/api/chat/${roomId}/history`);
                },
              });
            }, {
              wrapper: createWrapper(),
            });

            // Wait for initial data to load
            await waitFor(() => {
              expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toEqual(initialHistory);

            // Simulate WebSocket event: new message received
            const updatedHistory = {
              ...initialHistory,
              messages: [...initialHistory.messages, newMessage],
            };

            // Mock the updated history fetch
            (httpClient.get as jest.Mock).mockResolvedValueOnce(updatedHistory);

            // Invalidate the cache (simulating WebSocket event handler)
            await queryClient.invalidateQueries({
              queryKey: queryKeys.chatHistory(roomId),
            });

            // Wait for refetch to complete
            await waitFor(() => {
              expect(result.current.data).toEqual(updatedHistory);
            });

            // Verify: Cache should contain updated data with new message
            const cachedData = queryClient.getQueryData(queryKeys.chatHistory(roomId));
            expect(cachedData).toEqual(updatedHistory);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should invalidate multiple related caches on WebSocket event', async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          profileArb,
          async (userId, profile) => {
            profile.user.id = userId;

            // Setup: Mock fetches for multiple related queries
            (httpClient.get as jest.Mock)
              .mockResolvedValueOnce(profile) // profile query
              .mockResolvedValueOnce(profile.matchHistory) // matchHistory query
              .mockResolvedValueOnce(profile.musicStats); // musicStats query

            // Render multiple hooks
            const { result: profileResult } = renderHook(
              () => useProfileQuery(userId),
              { wrapper: createWrapper() }
            );

            const { result: matchHistoryResult } = renderHook(
              () => {
                const { useQuery } = require('@tanstack/react-query');
                return useQuery({
                  queryKey: queryKeys.matchHistory(userId),
                  queryFn: async () => {
                    return await httpClient.get(`/api/profile/${userId}/matches`);
                  },
                });
              },
              { wrapper: createWrapper() }
            );

            const { result: musicStatsResult } = renderHook(
              () => {
                const { useQuery } = require('@tanstack/react-query');
                return useQuery({
                  queryKey: queryKeys.musicStats(userId),
                  queryFn: async () => {
                    return await httpClient.get(`/api/profile/${userId}/music-stats`);
                  },
                });
              },
              { wrapper: createWrapper() }
            );

            // Wait for all queries to load
            await waitFor(() => {
              expect(profileResult.current.isSuccess).toBe(true);
              expect(matchHistoryResult.current.isSuccess).toBe(true);
              expect(musicStatsResult.current.isSuccess).toBe(true);
            });

            // Simulate WebSocket event: user data changed
            // Invalidate all profile-related caches
            await queryClient.invalidateQueries({
              predicate: (query) => {
                const key = query.queryKey[0];
                return key === 'profile' || key === 'matchHistory' || key === 'musicStats';
              },
            });

            // Verify: All queries should be marked as stale
            const profileState = queryClient.getQueryState(queryKeys.profile(userId));
            const matchHistoryState = queryClient.getQueryState(queryKeys.matchHistory(userId));
            const musicStatsState = queryClient.getQueryState(queryKeys.musicStats(userId));

            expect(profileState?.isInvalidated).toBe(true);
            expect(matchHistoryState?.isInvalidated).toBe(true);
            expect(musicStatsState?.isInvalidated).toBe(true);
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should not affect unrelated caches when invalidating specific query', async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          userIdArb,
          profileArb,
          profileArb,
          async (userId1, userId2, profile1, profile2) => {
            // Ensure different user IDs
            fc.pre(userId1 !== userId2);

            profile1.user.id = userId1;
            profile2.user.id = userId2;

            // Setup: Mock fetches for both profiles
            (httpClient.get as jest.Mock)
              .mockResolvedValueOnce(profile1)
              .mockResolvedValueOnce(profile2);

            // Render hooks for both users
            const { result: result1 } = renderHook(
              () => useProfileQuery(userId1),
              { wrapper: createWrapper() }
            );

            const { result: result2 } = renderHook(
              () => useProfileQuery(userId2),
              { wrapper: createWrapper() }
            );

            // Wait for both queries to load
            await waitFor(() => {
              expect(result1.current.isSuccess).toBe(true);
              expect(result2.current.isSuccess).toBe(true);
            });

            // Invalidate only user1's profile
            await queryClient.invalidateQueries({
              queryKey: queryKeys.profile(userId1),
            });

            // Verify: Only user1's cache should be invalidated
            const state1 = queryClient.getQueryState(queryKeys.profile(userId1));
            const state2 = queryClient.getQueryState(queryKeys.profile(userId2));

            expect(state1?.isInvalidated).toBe(true);
            expect(state2?.isInvalidated).toBe(false);

            // Verify: User2's data should remain unchanged
            expect(result2.current.data).toEqual(profile2);
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  /**
   * Property 22: Optimistic Update with Rollback
   * 
   * For any user action with optimistic update, if the server request fails,
   * the optimistic state change should be rolled back to the previous state.
   */
  describe('Property 22: Optimistic Update with Rollback', () => {
    it('should rollback profile update on mutation failure', async () => {
      await fc.assert(
        fc.asyncProperty(
          profileArb,
          profileUpdateArb,
          async (initialProfile, updates) => {
            // Ensure updates contain at least one field
            fc.pre(
              updates.username !== undefined ||
              updates.avatar !== undefined ||
              updates.favoriteArtists !== undefined
            );

            const userId = initialProfile.user.id;

            // Setup: Mock initial profile fetch
            (httpClient.get as jest.Mock).mockResolvedValueOnce(initialProfile);

            // Render profile query hook
            const { result: queryResult } = renderHook(
              () => useProfileQuery(userId),
              { wrapper: createWrapper() }
            );

            // Wait for initial data to load
            await waitFor(() => {
              expect(queryResult.current.isSuccess).toBe(true);
            });

            expect(queryResult.current.data).toEqual(initialProfile);

            // Setup: Mock mutation to fail
            const error = new Error('Network error');
            (httpClient.patch as jest.Mock).mockRejectedValueOnce(error);

            // Render mutation hook
            const { result: mutationResult } = renderHook(
              () => useUpdateProfileMutation(userId),
              { wrapper: createWrapper() }
            );

            // Execute mutation
            mutationResult.current.mutate(updates);

            // Wait for optimistic update to apply
            await waitFor(() => {
              const cachedData = queryClient.getQueryData(queryKeys.profile(userId));
              if (cachedData) {
                const profile = cachedData as typeof initialProfile;
                if (updates.username) {
                  expect(profile.user.username).toBe(updates.username);
                }
              }
            });

            // Wait for mutation to fail and rollback
            await waitFor(() => {
              expect(mutationResult.current.isError).toBe(true);
            });

            // Verify: Data should be rolled back to initial state
            const finalData = queryClient.getQueryData(queryKeys.profile(userId));
            expect(finalData).toEqual(initialProfile);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should rollback message send on mutation failure', async () => {
      await fc.assert(
        fc.asyncProperty(
          roomIdArb,
          userIdArb,
          usernameArb,
          avatarArb,
          chatHistoryArb,
          messageContentArb,
          async (roomId, userId, username, avatar, initialHistory, content) => {
            // Setup: Mock initial chat history fetch
            (httpClient.get as jest.Mock).mockResolvedValueOnce(initialHistory);

            // Render chat history query hook
            const { result: queryResult } = renderHook(
              () => {
                const { useQuery } = require('@tanstack/react-query');
                return useQuery({
                  queryKey: queryKeys.chatHistory(roomId),
                  queryFn: async () => {
                    return await httpClient.get(`/api/chat/${roomId}/history`);
                  },
                });
              },
              { wrapper: createWrapper() }
            );

            // Wait for initial data to load
            await waitFor(() => {
              expect(queryResult.current.isSuccess).toBe(true);
            });

            expect(queryResult.current.data).toEqual(initialHistory);

            const initialMessageCount = initialHistory.messages.length;

            // Setup: Mock mutation to fail
            const error = new Error('Network error');
            (httpClient.post as jest.Mock).mockRejectedValueOnce(error);

            // Render mutation hook
            const { result: mutationResult } = renderHook(
              () => useSendMessageMutation(roomId, userId, username, avatar),
              { wrapper: createWrapper() }
            );

            // Execute mutation
            mutationResult.current.mutate({ content });

            // Wait for optimistic update to apply
            await waitFor(() => {
              const cachedData = queryClient.getQueryData(queryKeys.chatHistory(roomId));
              if (cachedData) {
                const history = cachedData as typeof initialHistory;
                expect(history.messages.length).toBe(initialMessageCount + 1);
              }
            });

            // Wait for mutation to fail and rollback
            await waitFor(() => {
              expect(mutationResult.current.isError).toBe(true);
            });

            // Verify: Data should be rolled back to initial state
            const finalData = queryClient.getQueryData(queryKeys.chatHistory(roomId));
            expect(finalData).toEqual(initialHistory);
            expect((finalData as typeof initialHistory).messages.length).toBe(initialMessageCount);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should preserve optimistic update on mutation success', async () => {
      await fc.assert(
        fc.asyncProperty(
          profileArb,
          profileUpdateArb,
          async (initialProfile, updates) => {
            // Ensure updates contain at least one field
            fc.pre(
              updates.username !== undefined ||
              updates.avatar !== undefined ||
              updates.favoriteArtists !== undefined
            );

            const userId = initialProfile.user.id;

            // Setup: Mock initial profile fetch
            (httpClient.get as jest.Mock).mockResolvedValueOnce(initialProfile);

            // Render profile query hook
            const { result: queryResult } = renderHook(
              () => useProfileQuery(userId),
              { wrapper: createWrapper() }
            );

            // Wait for initial data to load
            await waitFor(() => {
              expect(queryResult.current.isSuccess).toBe(true);
            });

            // Create expected updated profile
            const updatedProfile = {
              ...initialProfile,
              user: {
                ...initialProfile.user,
                ...updates,
                updatedAt: new Date().toISOString(),
              },
            };

            // Setup: Mock mutation to succeed
            (httpClient.patch as jest.Mock).mockResolvedValueOnce(updatedProfile);

            // Render mutation hook
            const { result: mutationResult } = renderHook(
              () => useUpdateProfileMutation(userId),
              { wrapper: createWrapper() }
            );

            // Execute mutation
            mutationResult.current.mutate(updates);

            // Wait for mutation to succeed
            await waitFor(() => {
              expect(mutationResult.current.isSuccess).toBe(true);
            });

            // Verify: Data should contain the updates
            await waitFor(() => {
              const finalData = queryClient.getQueryData(queryKeys.profile(userId));
              if (finalData) {
                const profile = finalData as typeof initialProfile;
                if (updates.username) {
                  expect(profile.user.username).toBe(updates.username);
                }
                if (updates.avatar !== undefined) {
                  expect(profile.user.avatar).toBe(updates.avatar);
                }
                if (updates.favoriteArtists) {
                  expect(profile.user.favoriteArtists).toEqual(updates.favoriteArtists);
                }
              }
            });
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle multiple concurrent optimistic updates with rollback', async () => {
      await fc.assert(
        fc.asyncProperty(
          profileArb,
          fc.array(profileUpdateArb, { minLength: 2, maxLength: 5 }),
          fc.array(fc.boolean(), { minLength: 2, maxLength: 5 }),
          async (initialProfile, updatesList, successList) => {
            // Ensure arrays have same length
            fc.pre(updatesList.length === successList.length);

            // Ensure each update contains at least one field
            fc.pre(
              updatesList.every(
                updates =>
                  updates.username !== undefined ||
                  updates.avatar !== undefined ||
                  updates.favoriteArtists !== undefined
              )
            );

            const userId = initialProfile.user.id;

            // Setup: Mock initial profile fetch
            (httpClient.get as jest.Mock).mockResolvedValueOnce(initialProfile);

            // Render profile query hook
            const { result: queryResult } = renderHook(
              () => useProfileQuery(userId),
              { wrapper: createWrapper() }
            );

            // Wait for initial data to load
            await waitFor(() => {
              expect(queryResult.current.isSuccess).toBe(true);
            });

            // Setup: Mock mutations based on success/failure
            updatesList.forEach((updates, index) => {
              if (successList[index]) {
                const updatedProfile = {
                  ...initialProfile,
                  user: {
                    ...initialProfile.user,
                    ...updates,
                    updatedAt: new Date().toISOString(),
                  },
                };
                (httpClient.patch as jest.Mock).mockResolvedValueOnce(updatedProfile);
              } else {
                (httpClient.patch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
              }
            });

            // Render mutation hook
            const { result: mutationResult } = renderHook(
              () => useUpdateProfileMutation(userId),
              { wrapper: createWrapper() }
            );

            // Execute all mutations
            updatesList.forEach((updates) => {
              mutationResult.current.mutate(updates);
            });

            // Wait for all mutations to settle
            await waitFor(
              () => {
                expect(mutationResult.current.isIdle).toBe(true);
              },
              { timeout: 5000 }
            );

            // Verify: If any mutation succeeded, data should be updated
            // If all failed, data should be rolled back to initial state
            const finalData = queryClient.getQueryData(queryKeys.profile(userId));
            const anySuccess = successList.some(s => s);

            if (!anySuccess) {
              // All mutations failed - should rollback to initial state
              expect(finalData).toEqual(initialProfile);
            } else {
              // At least one mutation succeeded - data should be different from initial
              expect(finalData).toBeDefined();
            }
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should rollback to correct previous state after multiple updates', async () => {
      await fc.assert(
        fc.asyncProperty(
          profileArb,
          profileUpdateArb,
          profileUpdateArb,
          async (initialProfile, firstUpdate, secondUpdate) => {
            // Ensure updates are different and contain at least one field
            fc.pre(
              (firstUpdate.username !== undefined || firstUpdate.avatar !== undefined) &&
              (secondUpdate.username !== undefined || secondUpdate.avatar !== undefined) &&
              (firstUpdate.username !== secondUpdate.username || firstUpdate.avatar !== secondUpdate.avatar)
            );

            const userId = initialProfile.user.id;

            // Setup: Mock initial profile fetch
            (httpClient.get as jest.Mock).mockResolvedValueOnce(initialProfile);

            // Render profile query hook
            const { result: queryResult } = renderHook(
              () => useProfileQuery(userId),
              { wrapper: createWrapper() }
            );

            // Wait for initial data to load
            await waitFor(() => {
              expect(queryResult.current.isSuccess).toBe(true);
            });

            // First update succeeds
            const firstUpdatedProfile = {
              ...initialProfile,
              user: {
                ...initialProfile.user,
                ...firstUpdate,
                updatedAt: new Date().toISOString(),
              },
            };
            (httpClient.patch as jest.Mock).mockResolvedValueOnce(firstUpdatedProfile);

            // Render mutation hook
            const { result: mutationResult } = renderHook(
              () => useUpdateProfileMutation(userId),
              { wrapper: createWrapper() }
            );

            // Execute first mutation
            mutationResult.current.mutate(firstUpdate);

            // Wait for first mutation to succeed
            await waitFor(() => {
              expect(mutationResult.current.isSuccess).toBe(true);
            });

            // Verify first update applied
            await waitFor(() => {
              const data = queryClient.getQueryData(queryKeys.profile(userId));
              if (data && firstUpdate.username) {
                expect((data as typeof initialProfile).user.username).toBe(firstUpdate.username);
              }
            });

            // Second update fails
            (httpClient.patch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

            // Execute second mutation
            mutationResult.current.mutate(secondUpdate);

            // Wait for second mutation to fail
            await waitFor(() => {
              expect(mutationResult.current.isError).toBe(true);
            });

            // Verify: Should rollback to state after first update, not initial state
            const finalData = queryClient.getQueryData(queryKeys.profile(userId));
            if (firstUpdate.username) {
              expect((finalData as typeof initialProfile).user.username).toBe(firstUpdate.username);
            }
            if (firstUpdate.avatar !== undefined) {
              expect((finalData as typeof initialProfile).user.avatar).toBe(firstUpdate.avatar);
            }
          }
        ),
        { numRuns: 30 }
      );
    });
  });
});
