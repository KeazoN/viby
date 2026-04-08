import { useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService } from '../services/profile-service';
import { useProfileStore } from '../stores/profile-store';
import { queryKeys } from '@viby/shared/query';
import type { Profile, UpdateProfileRequest } from '../types';

/**
 * useUpdateProfile Hook
 * 
 * Mutation hook for updating user profile with optimistic updates.
 * Integrates TanStack Query with Profile Zustand store.
 * 
 * Features:
 * - Optimistic UI updates for immediate feedback
 * - Automatic rollback on error
 * - Cache invalidation on success
 * - Store synchronization
 * 
 * @returns Mutation result with mutate function
 * 
 * 
 * @example
 * ```tsx
 * function EditProfileScreen() {
 *   const updateProfile = useUpdateProfile();
 *   
 *   const handleSave = () => {
 *     updateProfile.mutate(
 *       { username: 'newname', bio: 'New bio' },
 *       {
 *         onSuccess: () => {
 *           showToast('Profile updated!');
 *           navigation.goBack();
 *         },
 *         onError: (error) => {
 *           showToast('Failed to update profile');
 *         },
 *       }
 *     );
 *   };
 *   
 *   return (
 *     <View>
 *       <Input onChangeText={setText} />
 *       <Button
 *         onPress={handleSave}
 *         loading={updateProfile.isPending}
 *       >
 *         Save
 *       </Button>
 *     </View>
 *   );
 * }
 * ```
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const updateProfileStore = useProfileStore((state) => state.updateProfile);
  const profile = useProfileStore((state) => state.profile);

  return useMutation({
    mutationFn: async (updates: UpdateProfileRequest) => {
      const updatedProfile = await profileService.updateProfile(updates);
      return updatedProfile;
    },

    // Optimistic update - apply changes immediately to store
    onMutate: async (updates) => {
      if (!profile) return;

      const userId = profile.userId;

      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.profile(userId) });

      // Snapshot the previous value from cache
      const previousProfile = queryClient.getQueryData<Profile>(
        queryKeys.profile(userId)
      );

      // Optimistically update the Zustand store
      updateProfileStore(updates);

      // Optimistically update the TanStack Query cache
      if (previousProfile) {
        queryClient.setQueryData<Profile>(queryKeys.profile(userId), (old) => {
          if (!old) return old;

          return {
            ...old,
            ...updates,
            updatedAt: new Date().toISOString(),
          };
        });
      }

      // Return context with previous value for rollback
      return { previousProfile, userId };
    },

    // Update store with server response on success
    onSuccess: (updatedProfile) => {
      useProfileStore.getState().setProfile(updatedProfile);
    },

    // Rollback on error
    onError: (error, updates, context) => {
      if (context?.previousProfile) {
        // Rollback TanStack Query cache
        queryClient.setQueryData(
          queryKeys.profile(context.userId),
          context.previousProfile
        );

        // Rollback Zustand store
        useProfileStore.getState().setProfile(context.previousProfile);
      }
    },

    // Refetch to ensure consistency
    onSettled: (data, error, variables, context) => {
      if (context?.userId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.profile(context.userId) });
      }
    },
  });
}
