import { httpClient } from '@viby/shared/networking';
import type {
  Profile,
  MusicStats,
  Match,
  GetProfileResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
  GetMatchHistoryResponse,
  GetMusicStatsResponse,
} from '../types';

/**
 * ProfileService handles user profile data, match history, and music statistics.
 * 
 * Integrates with:
 * - HttpClient from networking module for REST API calls
 */
export class ProfileService {
  /**
   * Get user profile by user ID
   * @param userId - The user ID to fetch profile for
   * @returns Promise resolving to the user profile
   * 
   * Display user information including username, avatar, and music statistics
   */
  async getProfile(userId: string): Promise<Profile> {
    try {
      const response = await httpClient.get<GetProfileResponse>(
        `/profile/${userId}`
      );
      return response.profile;
    } catch (error) {
      console.error('Failed to get profile:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   * @param updates - Partial profile updates
   * @returns Promise resolving to the updated profile
   * 
   * Allow users to edit their username and avatar
   * Send updates to Backend_API when profile changes are saved
   */
  async updateProfile(updates: UpdateProfileRequest): Promise<Profile> {
    try {
      const response = await httpClient.patch<UpdateProfileResponse>(
        '/profile',
        updates
      );
      return response.profile;
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  }

  /**
   * Get match history for the current user
   * @param options - Pagination options (limit and offset)
   * @returns Promise resolving to the match history
   * 
   * Display match history with past opponents and game results
   */
  async getMatchHistory(
    options?: { limit?: number; offset?: number }
  ): Promise<GetMatchHistoryResponse> {
    try {
      const params = new URLSearchParams();
      if (options?.limit) {
        params.append('limit', options.limit.toString());
      }
      if (options?.offset) {
        params.append('offset', options.offset.toString());
      }

      const queryString = params.toString();
      const url = `/profile/matches${queryString ? `?${queryString}` : ''}`;

      const response = await httpClient.get<GetMatchHistoryResponse>(url);
      return response;
    } catch (error) {
      console.error('Failed to get match history:', error);
      throw error;
    }
  }

  /**
   * Get music statistics for the current user
   * @returns Promise resolving to the music statistics
   * 
   * Display user's top artists, tracks, and genres from streaming service
   */
  async getMusicStats(): Promise<MusicStats> {
    try {
      const response = await httpClient.get<GetMusicStatsResponse>(
        '/profile/music-stats'
      );
      return response.stats;
    } catch (error) {
      console.error('Failed to get music stats:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const profileService = new ProfileService();
