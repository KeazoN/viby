/**
 * OnboardingScreen Unit Tests
 * 
 * Tests the onboarding flow including:
 * - Welcome step rendering
 * - Notification permissions step
 * - Music taste setup with artist search and selection
 * - Onboarding completion
 */

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { OnboardingScreen } from './OnboardingScreen';
import { httpClient } from '@viby/shared/networking';
import { useAuthStore } from '@viby/modules/auth';

// Mock dependencies
jest.mock('@viby/shared/networking');
jest.mock('@viby/modules/auth');
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    reset: jest.fn(),
  }),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('OnboardingScreen', () => {
  const mockHttpClient = httpClient as jest.Mocked<typeof httpClient>;
  const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockReturnValue({
      user: { id: 'user123', username: 'testuser' },
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
      setUser: jest.fn(),
      setLoading: jest.fn(),
    } as any);
  });

  describe('Welcome Step', () => {
    it('should render welcome message', () => {
      const { getByText } = render(<OnboardingScreen />);

      expect(getByText(/Welcome to Viby!/i)).toBeTruthy();
      expect(getByText(/Discover who's vibing to the same music/i)).toBeTruthy();
      expect(getByText(/Get Started/i)).toBeTruthy();
    });

    it('should navigate to notifications step when Get Started is pressed', () => {
      const { getByText } = render(<OnboardingScreen />);

      const getStartedButton = getByText('Get Started');
      fireEvent.press(getStartedButton);

      // Should show notifications step
      expect(getByText(/Stay Connected/i)).toBeTruthy();
      expect(getByText(/Enable Notifications/i)).toBeTruthy();
    });
  });

  describe('Notifications Step', () => {
    it('should render notification permission request', () => {
      const { getByText } = render(<OnboardingScreen />);

      // Navigate to notifications step
      fireEvent.press(getByText('Get Started'));

      expect(getByText(/Stay Connected/i)).toBeTruthy();
      expect(getByText(/Get notified when someone matches/i)).toBeTruthy();
      expect(getByText('Enable Notifications')).toBeTruthy();
      expect(getByText('Skip for Now')).toBeTruthy();
    });

    it('should navigate to music taste step when Enable Notifications is pressed', async () => {
      const { getByText } = render(<OnboardingScreen />);

      // Navigate to notifications step
      fireEvent.press(getByText('Get Started'));

      // Press Enable Notifications
      fireEvent.press(getByText('Enable Notifications'));

      await waitFor(() => {
        expect(getByText(/Your Music Taste/i)).toBeTruthy();
      });
    });

    it('should navigate to music taste step when Skip is pressed', () => {
      const { getByText } = render(<OnboardingScreen />);

      // Navigate to notifications step
      fireEvent.press(getByText('Get Started'));

      // Press Skip
      fireEvent.press(getByText('Skip for Now'));

      expect(getByText(/Your Music Taste/i)).toBeTruthy();
    });
  });

  describe('Music Taste Step', () => {
    beforeEach(() => {
      mockHttpClient.get.mockResolvedValue([
        { id: '1', name: 'Artist 1', picture_medium: 'https://example.com/1.jpg' },
        { id: '2', name: 'Artist 2', picture_medium: 'https://example.com/2.jpg' },
        { id: '3', name: 'Artist 3', picture_medium: 'https://example.com/3.jpg' },
      ]);
    });

    it('should render music taste setup', async () => {
      const { getByText, getByPlaceholderText } = render(<OnboardingScreen />);

      // Navigate to music taste step
      fireEvent.press(getByText('Get Started'));
      fireEvent.press(getByText('Skip for Now'));

      expect(getByText(/Your Music Taste/i)).toBeTruthy();
      expect(getByText(/0 \/ 6 selected/i)).toBeTruthy();
      expect(getByPlaceholderText('Search for artists...')).toBeTruthy();
      expect(getByText('Complete Setup')).toBeTruthy();
      expect(getByText('Skip for Now')).toBeTruthy();
    });

    it('should search for artists when typing in search input', async () => {
      const { getByPlaceholderText, getByText } = render(<OnboardingScreen />);

      // Navigate to music taste step
      fireEvent.press(getByText('Get Started'));
      fireEvent.press(getByText('Skip for Now'));

      const searchInput = getByPlaceholderText('Search for artists...');
      fireEvent.changeText(searchInput, 'test artist');

      await waitFor(() => {
        expect(mockHttpClient.get).toHaveBeenCalledWith(
          '/onboarding/search-artists?q=test%20artist'
        );
      });

      await waitFor(() => {
        expect(getByText('Artist 1')).toBeTruthy();
        expect(getByText('Artist 2')).toBeTruthy();
        expect(getByText('Artist 3')).toBeTruthy();
      });
    });

    it('should select and deselect artists', async () => {
      const { getByPlaceholderText, getByText } = render(<OnboardingScreen />);

      // Navigate to music taste step
      fireEvent.press(getByText('Get Started'));
      fireEvent.press(getByText('Skip for Now'));

      // Search for artists
      const searchInput = getByPlaceholderText('Search for artists...');
      fireEvent.changeText(searchInput, 'test');

      await waitFor(() => {
        expect(getByText('Artist 1')).toBeTruthy();
      });

      // Select artist
      fireEvent.press(getByText('Artist 1'));

      await waitFor(() => {
        expect(getByText(/1 \/ 6 selected/i)).toBeTruthy();
      });

      // Deselect artist
      fireEvent.press(getByText('Artist 1'));

      await waitFor(() => {
        expect(getByText(/0 \/ 6 selected/i)).toBeTruthy();
      });
    });

    it('should limit selection to 6 artists', async () => {
      mockHttpClient.get.mockResolvedValue([
        { id: '1', name: 'Artist 1', picture_medium: 'https://example.com/1.jpg' },
        { id: '2', name: 'Artist 2', picture_medium: 'https://example.com/2.jpg' },
        { id: '3', name: 'Artist 3', picture_medium: 'https://example.com/3.jpg' },
        { id: '4', name: 'Artist 4', picture_medium: 'https://example.com/4.jpg' },
        { id: '5', name: 'Artist 5', picture_medium: 'https://example.com/5.jpg' },
        { id: '6', name: 'Artist 6', picture_medium: 'https://example.com/6.jpg' },
        { id: '7', name: 'Artist 7', picture_medium: 'https://example.com/7.jpg' },
      ]);

      const { getByPlaceholderText, getByText } = render(<OnboardingScreen />);

      // Navigate to music taste step
      fireEvent.press(getByText('Get Started'));
      fireEvent.press(getByText('Skip for Now'));

      // Search for artists
      const searchInput = getByPlaceholderText('Search for artists...');
      fireEvent.changeText(searchInput, 'test');

      await waitFor(() => {
        expect(getByText('Artist 1')).toBeTruthy();
      });

      // Select 6 artists
      for (let i = 1; i <= 6; i++) {
        fireEvent.press(getByText(`Artist ${i}`));
      }

      await waitFor(() => {
        expect(getByText(/6 \/ 6 selected/i)).toBeTruthy();
      });

      // Try to select 7th artist
      fireEvent.press(getByText('Artist 7'));

      // Should show alert
      expect(Alert.alert).toHaveBeenCalledWith(
        'Maximum Reached',
        'You can select up to 6 favorite artists.'
      );
    });

    it('should complete onboarding when 6 artists are selected', async () => {
      mockHttpClient.get.mockResolvedValue([
        { id: '1', name: 'Artist 1', picture_medium: 'https://example.com/1.jpg' },
        { id: '2', name: 'Artist 2', picture_medium: 'https://example.com/2.jpg' },
        { id: '3', name: 'Artist 3', picture_medium: 'https://example.com/3.jpg' },
        { id: '4', name: 'Artist 4', picture_medium: 'https://example.com/4.jpg' },
        { id: '5', name: 'Artist 5', picture_medium: 'https://example.com/5.jpg' },
        { id: '6', name: 'Artist 6', picture_medium: 'https://example.com/6.jpg' },
      ]);
      mockHttpClient.post.mockResolvedValue(undefined);

      const mockNavigation = { reset: jest.fn() };
      jest.spyOn(require('@react-navigation/native'), 'useNavigation').mockReturnValue(mockNavigation);

      const { getByPlaceholderText, getByText } = render(<OnboardingScreen />);

      // Navigate to music taste step
      fireEvent.press(getByText('Get Started'));
      fireEvent.press(getByText('Skip for Now'));

      // Search for artists
      const searchInput = getByPlaceholderText('Search for artists...');
      fireEvent.changeText(searchInput, 'test');

      await waitFor(() => {
        expect(getByText('Artist 1')).toBeTruthy();
      });

      // Select 6 artists
      for (let i = 1; i <= 6; i++) {
        fireEvent.press(getByText(`Artist ${i}`));
      }

      await waitFor(() => {
        expect(getByText(/6 \/ 6 selected/i)).toBeTruthy();
      });

      // Complete onboarding
      fireEvent.press(getByText('Complete Setup'));

      await waitFor(() => {
        expect(mockHttpClient.post).toHaveBeenCalledWith('/onboarding/favorite-artists', {
          artistIds: ['1', '2', '3', '4', '5', '6'],
        });
      });

      await waitFor(() => {
        expect(mockNavigation.reset).toHaveBeenCalledWith({
          index: 0,
          routes: [{ name: 'Main' }],
        });
      });
    });

    it('should show error when trying to complete without 6 artists', async () => {
      const { getByText } = render(<OnboardingScreen />);

      // Navigate to music taste step
      fireEvent.press(getByText('Get Started'));
      fireEvent.press(getByText('Skip for Now'));

      // Try to complete without selecting artists
      fireEvent.press(getByText('Complete Setup'));

      expect(Alert.alert).toHaveBeenCalledWith(
        'Selection Required',
        'Please select exactly 6 favorite artists to continue.'
      );
    });

    it('should handle search error gracefully', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('Network error'));

      const { getByPlaceholderText, getByText } = render(<OnboardingScreen />);

      // Navigate to music taste step
      fireEvent.press(getByText('Get Started'));
      fireEvent.press(getByText('Skip for Now'));

      // Search for artists
      const searchInput = getByPlaceholderText('Search for artists...');
      fireEvent.changeText(searchInput, 'test');

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Search Error',
          'Failed to search for artists. Please try again.'
        );
      });
    });

    it('should handle onboarding completion error gracefully', async () => {
      mockHttpClient.get.mockResolvedValue([
        { id: '1', name: 'Artist 1', picture_medium: 'https://example.com/1.jpg' },
        { id: '2', name: 'Artist 2', picture_medium: 'https://example.com/2.jpg' },
        { id: '3', name: 'Artist 3', picture_medium: 'https://example.com/3.jpg' },
        { id: '4', name: 'Artist 4', picture_medium: 'https://example.com/4.jpg' },
        { id: '5', name: 'Artist 5', picture_medium: 'https://example.com/5.jpg' },
        { id: '6', name: 'Artist 6', picture_medium: 'https://example.com/6.jpg' },
      ]);
      mockHttpClient.post.mockRejectedValue(new Error('Server error'));

      const { getByPlaceholderText, getByText } = render(<OnboardingScreen />);

      // Navigate to music taste step
      fireEvent.press(getByText('Get Started'));
      fireEvent.press(getByText('Skip for Now'));

      // Search and select 6 artists
      const searchInput = getByPlaceholderText('Search for artists...');
      fireEvent.changeText(searchInput, 'test');

      await waitFor(() => {
        expect(getByText('Artist 1')).toBeTruthy();
      });

      for (let i = 1; i <= 6; i++) {
        fireEvent.press(getByText(`Artist ${i}`));
      }

      // Try to complete
      fireEvent.press(getByText('Complete Setup'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Onboarding Error',
          'Failed to save your preferences. Please try again.'
        );
      });
    });

    it('should allow skipping music taste setup', async () => {
      const mockNavigation = { reset: jest.fn() };
      jest.spyOn(require('@react-navigation/native'), 'useNavigation').mockReturnValue(mockNavigation);

      // Mock Alert.alert to simulate user pressing Skip
      (Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
        const skipButton = buttons?.find((b: any) => b.text === 'Skip');
        if (skipButton?.onPress) {
          skipButton.onPress();
        }
      });

      const { getByText } = render(<OnboardingScreen />);

      // Navigate to music taste step
      fireEvent.press(getByText('Get Started'));
      fireEvent.press(getByText('Skip for Now'));

      // Press skip button
      const skipButtons = screen.getAllByText('Skip for Now');
      fireEvent.press(skipButtons[skipButtons.length - 1]);

      await waitFor(() => {
        expect(mockNavigation.reset).toHaveBeenCalledWith({
          index: 0,
          routes: [{ name: 'Main' }],
        });
      });
    });
  });

  describe('Complete Button State', () => {
    it('should disable Complete Setup button when less than 6 artists selected', async () => {
      mockHttpClient.get.mockResolvedValue([
        { id: '1', name: 'Artist 1', picture_medium: 'https://example.com/1.jpg' },
      ]);

      const { getByPlaceholderText, getByText } = render(<OnboardingScreen />);

      // Navigate to music taste step
      fireEvent.press(getByText('Get Started'));
      fireEvent.press(getByText('Skip for Now'));

      // Search and select 1 artist
      const searchInput = getByPlaceholderText('Search for artists...');
      fireEvent.changeText(searchInput, 'test');

      await waitFor(() => {
        expect(getByText('Artist 1')).toBeTruthy();
      });

      fireEvent.press(getByText('Artist 1'));

      // Button should be disabled
      const completeButton = getByText('Complete Setup').parent;
      expect(completeButton?.props.accessibilityState?.disabled).toBe(true);
    });

    it('should enable Complete Setup button when exactly 6 artists selected', async () => {
      mockHttpClient.get.mockResolvedValue([
        { id: '1', name: 'Artist 1', picture_medium: 'https://example.com/1.jpg' },
        { id: '2', name: 'Artist 2', picture_medium: 'https://example.com/2.jpg' },
        { id: '3', name: 'Artist 3', picture_medium: 'https://example.com/3.jpg' },
        { id: '4', name: 'Artist 4', picture_medium: 'https://example.com/4.jpg' },
        { id: '5', name: 'Artist 5', picture_medium: 'https://example.com/5.jpg' },
        { id: '6', name: 'Artist 6', picture_medium: 'https://example.com/6.jpg' },
      ]);

      const { getByPlaceholderText, getByText } = render(<OnboardingScreen />);

      // Navigate to music taste step
      fireEvent.press(getByText('Get Started'));
      fireEvent.press(getByText('Skip for Now'));

      // Search and select 6 artists
      const searchInput = getByPlaceholderText('Search for artists...');
      fireEvent.changeText(searchInput, 'test');

      await waitFor(() => {
        expect(getByText('Artist 1')).toBeTruthy();
      });

      for (let i = 1; i <= 6; i++) {
        fireEvent.press(getByText(`Artist ${i}`));
      }

      await waitFor(() => {
        const completeButton = getByText('Complete Setup').parent;
        expect(completeButton?.props.accessibilityState?.disabled).toBe(false);
      });
    });
  });
});
