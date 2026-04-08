import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUpdateProfile } from './use-update-profile';
import { useProfileStore } from '../stores/profile-store';
import { profileService } from '../services/profile-service';
import type { Profile } from '../types';
import React from 'react';

// Mock the profile service
jest.mock('../services/profile-service');

const mockProfileService = profileService as jest.Mocked<typeof profileService>;

describe('useUpdateProfile', () => {
  let queryClient: QueryClient;

  const mockProfile: Profile = {
    id: 'profile-1',
    userId: 'user-1',
    username: 'testuser',
    avatar: 'https://example.com/avatar.jpg',
    bio: 'Test bio',
    musicStats: null,
    preferences: {
      notificationsEnabled: true,
      matchNotifications: true,
      messageNotifications: true,
      privacyMode: 'public',
    },
    spotifyLinked: true,
    deezerLinked: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Clear store before each test
    useProfileStore.getState().clear();
    useProfileStore.getState().setProfile(mockProfile);

    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should update profile successfully', async () => {
    const updatedProfile: Profile = {
      ...mockProfile,
      username: 'newusername',
      bio: 'New bio',
      updatedAt: '2024-01-02T00:00:00Z',
    };

    mockProfileService.updateProfile.mockResolvedValue(updatedProfile);

    const { result } = renderHook(() => useUpdateProfile(), { wrapper });

    result.current.mutate({ username: 'newusername', bio: 'New bio' });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockProfileService.updateProfile).toHaveBeenCalledWith({
      username: 'newusername',
      bio: 'New bio',
    });

    // Check that store was updated
    const storeProfile = useProfileStore.getState().profile;
    expect(storeProfile?.username).toBe('newusername');
    expect(storeProfile?.bio).toBe('New bio');
  });

  it('should apply optimistic update immediately', async () => {
    const updatedProfile: Profile = {
      ...mockProfile,
      username: 'newusername',
      updatedAt: '2024-01-02T00:00:00Z',
    };

    // Delay the response to test optimistic update
    mockProfileService.updateProfile.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(updatedProfile), 100);
        })
    );

    const { result } = renderHook(() => useUpdateProfile(), { wrapper });

    result.current.mutate({ username: 'newusername' });

    // Check optimistic update in store (should be immediate)
    await waitFor(() => {
      const storeProfile = useProfileStore.getState().profile;
      expect(storeProfile?.username).toBe('newusername');
    });

    // Wait for mutation to complete
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('should rollback on error', async () => {
    const error = new Error('Update failed');
    mockProfileService.updateProfile.mockRejectedValue(error);

    const { result } = renderHook(() => useUpdateProfile(), { wrapper });

    result.current.mutate({ username: 'newusername' });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Check that store was rolled back to original value
    const storeProfile = useProfileStore.getState().profile;
    expect(storeProfile?.username).toBe('testuser');
  });

  it('should handle mutation when profile is null', async () => {
    // Clear profile
    useProfileStore.getState().clear();

    const { result } = renderHook(() => useUpdateProfile(), { wrapper });

    result.current.mutate({ username: 'newusername' });

    // Should not throw error, just not do optimistic update
    await waitFor(() => {
      expect(result.current.isIdle || result.current.isPending).toBe(true);
    });
  });

  it('should update multiple fields', async () => {
    const updatedProfile: Profile = {
      ...mockProfile,
      username: 'newusername',
      avatar: 'https://example.com/new-avatar.jpg',
      bio: 'New bio',
      preferences: {
        ...mockProfile.preferences,
        notificationsEnabled: false,
      },
      updatedAt: '2024-01-02T00:00:00Z',
    };

    mockProfileService.updateProfile.mockResolvedValue(updatedProfile);

    const { result } = renderHook(() => useUpdateProfile(), { wrapper });

    result.current.mutate({
      username: 'newusername',
      avatar: 'https://example.com/new-avatar.jpg',
      bio: 'New bio',
      preferences: {
        notificationsEnabled: false,
      },
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const storeProfile = useProfileStore.getState().profile;
    expect(storeProfile?.username).toBe('newusername');
    expect(storeProfile?.avatar).toBe('https://example.com/new-avatar.jpg');
    expect(storeProfile?.bio).toBe('New bio');
    expect(storeProfile?.preferences.notificationsEnabled).toBe(false);
  });

  it('should provide loading state', async () => {
    const updatedProfile: Profile = {
      ...mockProfile,
      username: 'newusername',
      updatedAt: '2024-01-02T00:00:00Z',
    };

    mockProfileService.updateProfile.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(updatedProfile), 50);
        })
    );

    const { result } = renderHook(() => useUpdateProfile(), { wrapper });

    expect(result.current.isPending).toBe(false);

    result.current.mutate({ username: 'newusername' });

    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.isPending).toBe(false);
  });
});
