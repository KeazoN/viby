/**
 * Onboarding Screen
 * 
 * Handles first-time user onboarding flow:
 * - Welcome message
 * - Notification permissions request
 * - Music taste setup (favorite artists selection)
 * - Mark onboarding complete
 * 
 * Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/navigation/types';
import { Button, Text, Card, OptimizedImage } from '@viby/shared/design-system';
import { colors, spacing } from '@viby/shared/design-system';
import { httpClient } from '@viby/shared/networking';
import { useAuthStore } from '@viby/modules/auth';
import { debounce } from '@viby/shared/utils';

type OnboardingScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Artist {
  id: string;
  name: string;
  picture_medium: string;
}

type OnboardingStep = 'welcome' | 'notifications' | 'music-taste';

export function OnboardingScreen() {
  const navigation = useNavigation<OnboardingScreenNavigationProp>();
  const { user } = useAuthStore();
  
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Artist[]>([]);
  const [selectedArtists, setSelectedArtists] = useState<Artist[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create debounced search function
  const debouncedSearchRef = useRef(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      try {
        const results = await httpClient.get<Artist[]>(
          `/onboarding/search-artists?q=${encodeURIComponent(query)}`
        );
        setSearchResults(results);
      } catch (error) {
        console.error('Failed to search artists:', error);
        Alert.alert('Search Error', 'Failed to search for artists. Please try again.');
      } finally {
        setIsSearching(false);
      }
    }, 300)
  );

  // Cleanup debounced function on unmount
  useEffect(() => {
    return () => {
      // No cleanup needed for our simple debounce implementation
    };
  }, []);

  // Step 1: Welcome
  const handleContinueFromWelcome = () => {
    setCurrentStep('notifications');
  };

  // Step 2: Notification Permissions
  const handleRequestNotifications = async () => {
    try {
      // For now, we'll skip the actual notification permission request
      // This can be implemented later with expo-notifications or react-native-permissions
      Alert.alert(
        'Notifications',
        'Notification permissions will be requested when you receive your first match!',
        [{ text: 'OK' }]
      );

      // Continue to music taste setup
      setCurrentStep('music-taste');
    } catch (error) {
      console.error('Failed to request notification permissions:', error);
      // Continue anyway
      setCurrentStep('music-taste');
    }
  };

  const handleSkipNotifications = () => {
    setCurrentStep('music-taste');
  };

  // Step 3: Music Taste Setup
  const handleSearchArtists = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    // Set searching state immediately for UI feedback
    setIsSearching(true);
    
    // Call debounced search function
    debouncedSearchRef.current(query);
  };

  const handleSelectArtist = (artist: Artist) => {
    if (selectedArtists.find((a) => a.id === artist.id)) {
      // Deselect
      setSelectedArtists(selectedArtists.filter((a) => a.id !== artist.id));
    } else if (selectedArtists.length < 6) {
      // Select (max 6)
      setSelectedArtists([...selectedArtists, artist]);
    } else {
      Alert.alert('Maximum Reached', 'You can select up to 6 favorite artists.');
    }
  };

  const handleCompleteOnboarding = async () => {
    if (selectedArtists.length !== 6) {
      Alert.alert(
        'Selection Required',
        'Please select exactly 6 favorite artists to continue.'
      );
      return;
    }

    try {
      setIsSubmitting(true);

      // Submit favorite artists to backend
      await httpClient.post('/onboarding/favorite-artists', {
        artistIds: selectedArtists.map((a) => a.id),
      });

      // Navigate to main app
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      Alert.alert(
        'Onboarding Error',
        'Failed to save your preferences. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipMusicTaste = async () => {
    Alert.alert(
      'Skip Music Taste Setup?',
      'You can set up your music preferences later in your profile.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          onPress: async () => {
            // Navigate to main app without saving artists
            navigation.reset({
              index: 0,
              routes: [{ name: 'Main' }],
            });
          },
        },
      ]
    );
  };

  // Render Welcome Step
  const renderWelcomeStep = () => (
    <View style={styles.stepContainer} testID="onboarding-welcome-step">
      <View style={styles.contentSection}>
        <Text variant="h1" align="center" style={styles.welcomeTitle}>
          Welcome to Viby! 🎵
        </Text>
        <Text variant="body" color="secondary" align="center" style={styles.welcomeText}>
          Discover who's vibing to the same music right now, connect instantly, and play together.
        </Text>
        <Text variant="bodySmall" color="secondary" align="center" style={styles.welcomeSubtext}>
          Let's get you set up in just a few steps.
        </Text>
      </View>

      <View style={styles.buttonSection}>
        <Button
          variant="primary"
          size="lg"
          onPress={handleContinueFromWelcome}
          fullWidth
          testID="button-get-started"
          accessibilityLabel="Continue to setup"
        >
          Get Started
        </Button>

        {/* Legal Links */}
        <View style={styles.legalLinksContainer}>
          <Text variant="caption" color="secondary" align="center">
            By continuing, you agree to our{' '}
          </Text>
          <View style={styles.legalLinksRow}>
            <TouchableOpacity
              onPress={() => navigation.navigate('LegalDocument', { documentType: 'terms-of-service' })}
              accessibilityLabel="View terms of service"
              testID="link-terms-of-service"
            >
              <Text variant="caption" style={styles.legalLink}>
                Terms of Service
              </Text>
            </TouchableOpacity>
            <Text variant="caption" color="secondary"> and </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('LegalDocument', { documentType: 'privacy-policy' })}
              accessibilityLabel="View privacy policy"
              testID="link-privacy-policy"
            >
              <Text variant="caption" style={styles.legalLink}>
                Privacy Policy
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  // Render Notifications Step
  const renderNotificationsStep = () => (
    <View style={styles.stepContainer} testID="onboarding-notifications-step">
      <View style={styles.contentSection}>
        <Text variant="h2" align="center" style={styles.stepTitle}>
          Stay Connected 🔔
        </Text>
        <Text variant="body" color="secondary" align="center" style={styles.stepText}>
          Get notified when someone matches with you or sends you a message.
        </Text>
        <Text variant="bodySmall" color="secondary" align="center" style={styles.stepSubtext}>
          You can change this anytime in Settings.
        </Text>
      </View>

      <View style={styles.buttonSection}>
        <Button
          variant="primary"
          size="lg"
          onPress={handleRequestNotifications}
          fullWidth
          testID="button-enable-notifications"
          accessibilityLabel="Enable notifications"
        >
          Enable Notifications
        </Button>
        <View style={styles.skipButton}>
          <Button
            variant="ghost"
            size="md"
            onPress={handleSkipNotifications}
            fullWidth
            testID="button-skip-notifications"
            accessibilityLabel="Skip notifications"
          >
            Skip for Now
          </Button>
        </View>
      </View>
    </View>
  );

  // Render Music Taste Step
  const renderMusicTasteStep = () => (
    <View style={styles.stepContainer} testID="onboarding-music-taste-step">
      <View style={styles.musicTasteHeader}>
        <Text variant="h2" align="center" style={styles.stepTitle}>
          Your Music Taste 🎸
        </Text>
        <Text variant="body" color="secondary" align="center" style={styles.stepText}>
          Select 6 of your favorite artists to help us match you with like-minded music lovers.
        </Text>
        <Text variant="bodySmall" color="secondary" align="center" style={styles.selectionCount} testID="artist-selection-count">
          {selectedArtists.length} / 6 selected
        </Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for artists..."
          placeholderTextColor={colors.text.tertiary}
          value={searchQuery}
          onChangeText={handleSearchArtists}
          testID="input-search-artists"
          accessibilityLabel="Search for artists"
        />
      </View>

      {/* Selected Artists */}
      {selectedArtists.length > 0 && (
        <View style={styles.selectedArtistsContainer}>
          <Text variant="bodySmall" color="secondary" style={styles.selectedLabel}>
            Selected Artists:
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {selectedArtists.map((artist) => (
              <TouchableOpacity
                key={artist.id}
                style={styles.selectedArtistChip}
                onPress={() => handleSelectArtist(artist)}
                accessibilityLabel={`Remove ${artist.name}`}
              >
                <OptimizedImage
                  uri={artist.picture_medium}
                  width={24}
                  height={24}
                  borderRadius={12}
                  priority="low"
                  accessibilityLabel={`${artist.name} thumbnail`}
                />
                <Text variant="caption" style={styles.selectedArtistName} numberOfLines={1}>
                  {artist.name}
                </Text>
                <Text variant="caption" style={styles.removeIcon}>
                  ✕
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Search Results */}
      <View style={styles.searchResultsContainer}>
        {isSearching ? (
          <View style={styles.loadingContainer} testID="artist-search-loading">
            <ActivityIndicator size="large" color={colors.accent.cyan} />
          </View>
        ) : searchResults.length > 0 ? (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            testID="artist-search-results"
            renderItem={({ item }) => {
              const isSelected = selectedArtists.find((a) => a.id === item.id);
              return (
                <TouchableOpacity
                  style={[styles.artistCard, isSelected && styles.artistCardSelected]}
                  onPress={() => handleSelectArtist(item)}
                  testID={`artist-card-${item.id}`}
                  accessibilityLabel={`${isSelected ? 'Deselect' : 'Select'} ${item.name}`}
                >
                  <OptimizedImage
                    uri={item.picture_medium}
                    width={48}
                    height={48}
                    borderRadius={24}
                    priority="low"
                    accessibilityLabel={`${item.name} image`}
                  />
                  <Text variant="body" style={styles.artistName}>
                    {item.name}
                  </Text>
                  {isSelected && (
                    <View style={styles.checkmark}>
                      <Text variant="body">✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
            showsVerticalScrollIndicator={false}
          />
        ) : searchQuery.trim() ? (
          <View style={styles.emptyContainer} testID="artist-search-empty">
            <Text variant="bodySmall" color="secondary" align="center">
              No artists found. Try a different search.
            </Text>
          </View>
        ) : (
          <View style={styles.emptyContainer} testID="artist-search-prompt">
            <Text variant="bodySmall" color="secondary" align="center">
              Search for your favorite artists to get started.
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonSection}>
        <Button
          variant="primary"
          size="lg"
          onPress={handleCompleteOnboarding}
          fullWidth
          disabled={selectedArtists.length !== 6 || isSubmitting}
          testID="button-complete-setup"
          accessibilityLabel="Complete onboarding"
        >
          {isSubmitting ? 'Saving...' : 'Complete Setup'}
        </Button>
        <View style={styles.skipButton}>
          <Button
            variant="ghost"
            size="md"
            onPress={handleSkipMusicTaste}
            fullWidth
            disabled={isSubmitting}
            testID="button-skip-music-taste"
            accessibilityLabel="Skip music taste setup"
          >
            Skip for Now
          </Button>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container} testID="onboarding-screen">
      {currentStep === 'welcome' && renderWelcomeStep()}
      {currentStep === 'notifications' && renderNotificationsStep()}
      {currentStep === 'music-taste' && renderMusicTasteStep()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[8],
  },
  contentSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
  },
  welcomeTitle: {
    marginBottom: spacing[4],
  },
  welcomeText: {
    marginBottom: spacing[3],
    textAlign: 'center',
  },
  welcomeSubtext: {
    textAlign: 'center',
  },
  stepTitle: {
    marginBottom: spacing[4],
  },
  stepText: {
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  stepSubtext: {
    textAlign: 'center',
  },
  buttonSection: {
    paddingBottom: spacing[8],
  },
  skipButton: {
    marginTop: spacing[4],
  },
  legalLinksContainer: {
    marginTop: spacing[6],
    alignItems: 'center',
  },
  legalLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[1],
  },
  legalLink: {
    color: colors.accent.cyan,
    textDecorationLine: 'underline',
  },
  musicTasteHeader: {
    marginBottom: spacing[4],
  },
  selectionCount: {
    marginTop: spacing[2],
    textAlign: 'center',
  },
  searchContainer: {
    marginBottom: spacing[4],
  },
  searchInput: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontSize: 16,
    color: colors.text.primary,
  },
  selectedArtistsContainer: {
    marginBottom: spacing[4],
  },
  selectedLabel: {
    marginBottom: spacing[2],
  },
  selectedArtistChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: 20,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    marginRight: spacing[2],
    maxWidth: 150,
  },
  selectedArtistName: {
    flex: 1,
    color: colors.text.primary,
    marginLeft: spacing[2],
  },
  removeIcon: {
    marginLeft: spacing[2],
    color: colors.text.secondary,
  },
  searchResultsContainer: {
    flex: 1,
    marginBottom: spacing[4],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[8],
  },
  artistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: spacing[3],
    marginBottom: spacing[2],
  },
  artistCardSelected: {
    backgroundColor: colors.accent.cyan + '20',
    borderWidth: 2,
    borderColor: colors.accent.cyan,
  },
  artistName: {
    flex: 1,
    color: colors.text.primary,
    marginLeft: spacing[3],
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent.cyan,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
