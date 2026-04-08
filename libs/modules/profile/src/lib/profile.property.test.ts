import * as fc from 'fast-check';
import type {
  Profile,
  UpdateProfileRequest,
  UpdateProfileResponse,
} from './types';

/**
 * Property-Based Tests for Profile Module
 * 
 * These tests use fast-check to verify properties hold across many generated inputs.
 */

// Define global __DEV__
(global as any).__DEV__ = false;

// Mock dependencies before importing
jest.mock('@viby/shared/networking', () => ({
  httpClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    put: jest.fn(),
  },
}));

// Import after mocking
import { profileService } from './services/profile-service';
import { httpClient } from '@viby/shared/networking';

describe('Profile Module - Property-Based Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Arbitraries for generating test data
  const usernameArb = fc.string({ minLength: 3, maxLength: 30 });
  const bioArb = fc.oneof(
    fc.constant(null),
    fc.string({ minLength: 0, maxLength: 500 })
  );
  const avatarArb = fc.oneof(fc.constant(null), fc.webUrl());

  const userPreferencesArb = fc.record({
    notificationsEnabled: fc.boolean(),
    matchNotifications: fc.boolean(),
    messageNotifications: fc.boolean(),
    privacyMode: fc.constantFrom('public', 'friends', 'private'),
  });

  const partialUserPreferencesArb = fc.record(
    {
      notificationsEnabled: fc.boolean(),
      matchNotifications: fc.boolean(),
      messageNotifications: fc.boolean(),
      privacyMode: fc.constantFrom('public', 'friends', 'private'),
    },
    { requiredKeys: [] }
  );

  const updateProfileRequestArb = fc.record(
    {
      username: usernameArb,
      avatar: avatarArb,
      bio: bioArb,
      preferences: partialUserPreferencesArb,
    },
    { requiredKeys: [] }
  ) as fc.Arbitrary<UpdateProfileRequest>;

  const profileArb = fc.record({
    id: fc.uuid(),
    userId: fc.uuid(),
    username: usernameArb,
    avatar: avatarArb,
    bio: bioArb,
    musicStats: fc.constant(null),
    preferences: userPreferencesArb,
    spotifyLinked: fc.boolean(),
    deezerLinked: fc.boolean(),
    createdAt: fc.date().map(d => d.toISOString()),
    updatedAt: fc.date().map(d => d.toISOString()),
  }) as fc.Arbitrary<Profile>;

  /**
   * Property 27: Profile Update API Call
   * 
   * For any profile field update, the Profile_Module should send a PATCH request 
   * to Backend_API with the updated fields.
   */
  describe('Property 27: Profile Update API Call', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should send PATCH request with username update', async () => {
      await fc.assert(
        fc.asyncProperty(
          usernameArb,
          profileArb,
          async (newUsername, mockProfile) => {
            // Clear mocks for each property test run
            jest.clearAllMocks();

            // Setup: Mock successful API response
            const mockResponse: UpdateProfileResponse = {
              profile: {
                ...mockProfile,
                username: newUsername,
                updatedAt: new Date().toISOString(),
              },
            };

            (httpClient.patch as jest.Mock).mockResolvedValue(mockResponse);

            // Act: Update profile with new username
            const updates: UpdateProfileRequest = { username: newUsername };
            await profileService.updateProfile(updates);

            // Assert: PATCH request should be called with correct endpoint and data
            expect(httpClient.patch).toHaveBeenCalledWith('/profile', updates);
            expect(httpClient.patch).toHaveBeenCalledTimes(1);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should send PATCH request with avatar update', async () => {
      await fc.assert(
        fc.asyncProperty(
          avatarArb,
          profileArb,
          async (newAvatar, mockProfile) => {
            // Clear mocks for each property test run
            jest.clearAllMocks();

            // Setup: Mock successful API response
            const mockResponse: UpdateProfileResponse = {
              profile: {
                ...mockProfile,
                avatar: newAvatar,
                updatedAt: new Date().toISOString(),
              },
            };

            (httpClient.patch as jest.Mock).mockResolvedValue(mockResponse);

            // Act: Update profile with new avatar
            const updates: UpdateProfileRequest = { avatar: newAvatar ?? undefined };
            await profileService.updateProfile(updates);

            // Assert: PATCH request should be called with correct endpoint and data
            expect(httpClient.patch).toHaveBeenCalledWith('/profile', updates);
            expect(httpClient.patch).toHaveBeenCalledTimes(1);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should send PATCH request with bio update', async () => {
      await fc.assert(
        fc.asyncProperty(
          bioArb,
          profileArb,
          async (newBio, mockProfile) => {
            // Clear mocks for each property test run
            jest.clearAllMocks();

            // Setup: Mock successful API response
            const mockResponse: UpdateProfileResponse = {
              profile: {
                ...mockProfile,
                bio: newBio,
                updatedAt: new Date().toISOString(),
              },
            };

            (httpClient.patch as jest.Mock).mockResolvedValue(mockResponse);

            // Act: Update profile with new bio
            const updates: UpdateProfileRequest = { bio: newBio ?? undefined };
            await profileService.updateProfile(updates);

            // Assert: PATCH request should be called with correct endpoint and data
            expect(httpClient.patch).toHaveBeenCalledWith('/profile', updates);
            expect(httpClient.patch).toHaveBeenCalledTimes(1);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should send PATCH request with preferences update', async () => {
      await fc.assert(
        fc.asyncProperty(
          partialUserPreferencesArb,
          profileArb,
          async (newPreferences, mockProfile) => {
            // Skip if preferences is empty
            fc.pre(Object.keys(newPreferences).length > 0);

            // Clear mocks for each property test run
            jest.clearAllMocks();

            // Setup: Mock successful API response
            const mockResponse: UpdateProfileResponse = {
              profile: {
                ...mockProfile,
                preferences: {
                  ...mockProfile.preferences,
                  ...newPreferences,
                },
                updatedAt: new Date().toISOString(),
              },
            };

            (httpClient.patch as jest.Mock).mockResolvedValue(mockResponse);

            // Act: Update profile with new preferences
            const updates: UpdateProfileRequest = { preferences: newPreferences };
            await profileService.updateProfile(updates);

            // Assert: PATCH request should be called with correct endpoint and data
            expect(httpClient.patch).toHaveBeenCalledWith('/profile', updates);
            expect(httpClient.patch).toHaveBeenCalledTimes(1);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should send PATCH request with multiple field updates', async () => {
      await fc.assert(
        fc.asyncProperty(
          updateProfileRequestArb,
          profileArb,
          async (updates, mockProfile) => {
            // Skip if no fields to update
            fc.pre(Object.keys(updates).length > 0);

            // Clear mocks for each property test run
            jest.clearAllMocks();

            // Setup: Mock successful API response
            const mockResponse: UpdateProfileResponse = {
              profile: {
                ...mockProfile,
                ...updates,
                preferences: updates.preferences
                  ? { ...mockProfile.preferences, ...updates.preferences }
                  : mockProfile.preferences,
                updatedAt: new Date().toISOString(),
              },
            };

            (httpClient.patch as jest.Mock).mockResolvedValue(mockResponse);

            // Act: Update profile with multiple fields
            await profileService.updateProfile(updates);

            // Assert: PATCH request should be called with correct endpoint and data
            expect(httpClient.patch).toHaveBeenCalledWith('/profile', updates);
            expect(httpClient.patch).toHaveBeenCalledTimes(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return updated profile from API response', async () => {
      await fc.assert(
        fc.asyncProperty(
          updateProfileRequestArb,
          profileArb,
          async (updates, mockProfile) => {
            // Skip if no fields to update
            fc.pre(Object.keys(updates).length > 0);

            // Clear mocks for each property test run
            jest.clearAllMocks();

            // Setup: Mock successful API response
            const expectedProfile: Profile = {
              ...mockProfile,
              ...updates,
              preferences: updates.preferences
                ? { ...mockProfile.preferences, ...updates.preferences }
                : mockProfile.preferences,
              updatedAt: new Date().toISOString(),
            };

            const mockResponse: UpdateProfileResponse = {
              profile: expectedProfile,
            };

            (httpClient.patch as jest.Mock).mockResolvedValue(mockResponse);

            // Act: Update profile
            const result = await profileService.updateProfile(updates);

            // Assert: Result should match the profile from API response
            expect(result).toEqual(expectedProfile);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle API errors gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(
          updateProfileRequestArb,
          fc.constantFrom(
            'Network error',
            'Validation error',
            'Server error',
            'Unauthorized'
          ),
          async (updates, errorMessage) => {
            // Skip if no fields to update
            fc.pre(Object.keys(updates).length > 0);

            // Clear mocks for each property test run
            jest.clearAllMocks();

            // Setup: Mock API error
            const error = new Error(errorMessage);
            (httpClient.patch as jest.Mock).mockRejectedValue(error);

            // Act & Assert: Should throw error
            await expect(profileService.updateProfile(updates)).rejects.toThrow(
              errorMessage
            );

            // Assert: PATCH request should still be called
            expect(httpClient.patch).toHaveBeenCalledWith('/profile', updates);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should send empty object if no updates provided', async () => {
      await fc.assert(
        fc.asyncProperty(profileArb, async (mockProfile) => {
          // Clear mocks for each property test run
          jest.clearAllMocks();

          // Setup: Mock successful API response
          const mockResponse: UpdateProfileResponse = {
            profile: mockProfile,
          };

          (httpClient.patch as jest.Mock).mockResolvedValue(mockResponse);

          // Act: Update profile with empty object
          const updates: UpdateProfileRequest = {};
          await profileService.updateProfile(updates);

          // Assert: PATCH request should be called with empty object
          expect(httpClient.patch).toHaveBeenCalledWith('/profile', {});
          expect(httpClient.patch).toHaveBeenCalledTimes(1);
        }),
        { numRuns: 30 }
      );
    });

    it('should preserve fields not included in update request', async () => {
      await fc.assert(
        fc.asyncProperty(
          usernameArb,
          profileArb,
          async (newUsername, mockProfile) => {
            // Clear mocks for each property test run
            jest.clearAllMocks();

            // Setup: Mock API response that only updates username
            const mockResponse: UpdateProfileResponse = {
              profile: {
                ...mockProfile,
                username: newUsername,
                updatedAt: new Date().toISOString(),
              },
            };

            (httpClient.patch as jest.Mock).mockResolvedValue(mockResponse);

            // Act: Update only username
            const updates: UpdateProfileRequest = { username: newUsername };
            const result = await profileService.updateProfile(updates);

            // Assert: Other fields should be preserved
            expect(result.avatar).toBe(mockProfile.avatar);
            expect(result.bio).toBe(mockProfile.bio);
            expect(result.preferences).toEqual(mockProfile.preferences);
            expect(result.spotifyLinked).toBe(mockProfile.spotifyLinked);
            expect(result.deezerLinked).toBe(mockProfile.deezerLinked);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle partial preferences updates correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.boolean(),
          profileArb,
          async (newNotificationSetting, mockProfile) => {
            // Clear mocks for each property test run
            jest.clearAllMocks();

            // Setup: Mock API response with partial preferences update
            const mockResponse: UpdateProfileResponse = {
              profile: {
                ...mockProfile,
                preferences: {
                  ...mockProfile.preferences,
                  notificationsEnabled: newNotificationSetting,
                },
                updatedAt: new Date().toISOString(),
              },
            };

            (httpClient.patch as jest.Mock).mockResolvedValue(mockResponse);

            // Act: Update only notificationsEnabled preference
            const updates: UpdateProfileRequest = {
              preferences: { notificationsEnabled: newNotificationSetting },
            };
            const result = await profileService.updateProfile(updates);

            // Assert: Only notificationsEnabled should change
            expect(result.preferences.notificationsEnabled).toBe(
              newNotificationSetting
            );
            expect(result.preferences.matchNotifications).toBe(
              mockProfile.preferences.matchNotifications
            );
            expect(result.preferences.messageNotifications).toBe(
              mockProfile.preferences.messageNotifications
            );
            expect(result.preferences.privacyMode).toBe(
              mockProfile.preferences.privacyMode
            );
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
