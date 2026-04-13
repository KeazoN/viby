/**
 * Profile Screen
 * 
 * Displays user profile, match history, and music stats.
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.7
 * - 12.1: Display user information including username, avatar, and music statistics
 * - 12.2: Display match history with past opponents and game results
 * - 12.3: Allow users to edit their username and avatar
 * - 12.7: Display user's top artists, tracks, and genres from streaming service
 */

import { useState, useEffect, useMemo } from 'react';
import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Text, Card, Button, Input, OptimizedImage } from '@viby/shared/design-system';
import { colors, spacing, borderRadius } from '@viby/shared/design-system';
import { animationPresets, timingConfigs, getStaggerDelay } from '@viby/shared/design-system';
import { useProfile, useUpdateProfile, useProfileData, useMatchHistoryData, useMusicStatsData } from '@viby/modules/profile';
import type { Match, Artist } from '@viby/modules/profile';

export function ProfileScreen() {
  // Use selector hooks to minimize re-renders (Requirement 9.7)
  const profile = useProfileData();
  const matchHistory = useMatchHistoryData();
  const musicStats = useMusicStatsData();
  const updateProfile = useUpdateProfile();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedUsername, setEditedUsername] = useState('');
  const [editedAvatar, setEditedAvatar] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Animation values for stats count-up
  const matchesCount = useSharedValue(0);
  const gamesCount = useSharedValue(0);
  const winRateCount = useSharedValue(0);

  // Animation values for card fade-in sequence
  const statsCardOpacity = useSharedValue(0);
  const statsCardTranslateY = useSharedValue(20);
  const musicCardOpacity = useSharedValue(0);
  const musicCardTranslateY = useSharedValue(20);
  const historyCardOpacity = useSharedValue(0);
  const historyCardTranslateY = useSharedValue(20);

  const handleEditProfile = () => {
    setIsEditing(true);
    setEditedUsername(profile?.username || '');
    setEditedAvatar(profile?.avatar || '');
    setValidationError(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedUsername('');
    setEditedAvatar('');
    setValidationError(null);
  };

  const validateUsername = (username: string): string | null => {
    if (!username || username.trim().length === 0) {
      return 'Username is required';
    }
    if (username.length < 3) {
      return 'Username must be at least 3 characters';
    }
    if (username.length > 20) {
      return 'Username must be at most 20 characters';
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return 'Username can only contain letters, numbers, and underscores';
    }
    return null;
  };

  const validateAvatar = (avatar: string): string | null => {
    if (avatar && avatar.trim().length > 0) {
      try {
        new URL(avatar);
      } catch {
        return 'Avatar must be a valid URL';
      }
    }
    return null;
  };

  const handleSaveProfile = async () => {
    // Validate username
    const usernameError = validateUsername(editedUsername);
    if (usernameError) {
      setValidationError(usernameError);
      return;
    }

    // Validate avatar
    const avatarError = validateAvatar(editedAvatar);
    if (avatarError) {
      setValidationError(avatarError);
      return;
    }

    // Check if anything changed
    if (
      editedUsername === profile?.username &&
      editedAvatar === (profile?.avatar || '')
    ) {
      setIsEditing(false);
      return;
    }

    // Submit updates
    try {
      await updateProfile.mutateAsync({
        username: editedUsername !== profile?.username ? editedUsername : undefined,
        avatar: editedAvatar !== (profile?.avatar || '') ? (editedAvatar || null) : undefined,
      });
      setIsEditing(false);
      setValidationError(null);
    } catch (error) {
      if (error instanceof Error) {
        setValidationError(error.message);
      } else {
        setValidationError('Failed to update profile. Please try again.');
      }
    }
  };

  // Calculate stats - memoize to prevent recalculation on every render (Requirement 9.7)
  const totalGames = useMemo(() => musicStats?.totalGamesPlayed || 0, [musicStats?.totalGamesPlayed]);
  const totalMatches = useMemo(() => musicStats?.totalMatches || 0, [musicStats?.totalMatches]);
  const wins = useMemo(
    () => matchHistory.filter((m) => m.gameResult?.winner === profile?.userId).length,
    [matchHistory, profile?.userId]
  );
  const winRate = useMemo(
    () => (totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0),
    [totalGames, wins]
  );

  // Trigger animations on mount
  useEffect(() => {
    // Count-up animation for stats
    matchesCount.value = withDelay(
      300,
      withTiming(totalMatches, {
        duration: 1000,
        easing: Easing.out(Easing.ease),
      })
    );
    gamesCount.value = withDelay(
      400,
      withTiming(totalGames, {
        duration: 1000,
        easing: Easing.out(Easing.ease),
      })
    );
    winRateCount.value = withDelay(
      500,
      withTiming(winRate, {
        duration: 1000,
        easing: Easing.out(Easing.ease),
      })
    );

    // Card fade-in sequence
    const animations = animationPresets.slideAndFadeIn(20, timingConfigs.normal);
    
    // Stats card
    statsCardOpacity.value = withDelay(200, animations.opacity);
    statsCardTranslateY.value = withDelay(200, animations.translateY);

    // Music card
    musicCardOpacity.value = withDelay(350, animations.opacity);
    musicCardTranslateY.value = withDelay(350, animations.translateY);

    // History card
    historyCardOpacity.value = withDelay(500, animations.opacity);
    historyCardTranslateY.value = withDelay(500, animations.translateY);
  }, [totalMatches, totalGames, winRate]);

  // Animated styles
  const animatedMatchesStyle = useAnimatedStyle(() => ({
    opacity: matchesCount.value > 0 ? 1 : 0,
  }));

  const animatedGamesStyle = useAnimatedStyle(() => ({
    opacity: gamesCount.value > 0 ? 1 : 0,
  }));

  const animatedWinRateStyle = useAnimatedStyle(() => ({
    opacity: winRateCount.value > 0 ? 1 : 0,
  }));

  const statsCardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: statsCardOpacity.value,
    transform: [{ translateY: statsCardTranslateY.value }],
  }));

  const musicCardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: musicCardOpacity.value,
    transform: [{ translateY: musicCardTranslateY.value }],
  }));

  const historyCardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: historyCardOpacity.value,
    transform: [{ translateY: historyCardTranslateY.value }],
  }));

  const renderMatchItem = useCallback(({ item }: { item: Match }) => {
    // Find the opponent (the user who is not the current user)
    const opponent = item.users.find((u) => u.id !== profile?.userId);
    const isWinner = item.gameResult?.winner === profile?.userId;
    const myScore = profile?.userId ? item.gameResult?.scores[profile.userId] : 0;
    const opponentScore = opponent?.id ? item.gameResult?.scores[opponent.id] : 0;

    return (
      <MatchItem
        item={item}
        opponent={opponent}
        isWinner={isWinner}
        myScore={myScore}
        opponentScore={opponentScore}
      />
    );
  }, [profile?.userId]);

  const renderArtistItem = useCallback(({ item }: { item: Artist }) => (
    <ArtistItem item={item} />
  ), []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      testID="profile-screen"
    >
      {/* User Avatar and Username */}
      <View style={styles.header}>
        {isEditing ? (
          <>
            {/* Avatar URL Input */}
            <View style={styles.editAvatarContainer}>
              {editedAvatar ? (
                <OptimizedImage
                  uri={editedAvatar}
                  width={96}
                  height={96}
                  borderRadius={48}
                  priority="high"
                  accessibilityLabel="Profile avatar preview"
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text variant="h2" style={styles.avatarInitials}>
                    {editedUsername.slice(0, 2).toUpperCase() || 'U'}
                  </Text>
                </View>
              )}
            </View>
            <Input
              value={editedAvatar}
              onChangeText={setEditedAvatar}
              placeholder="Avatar URL (optional)"
              accessibilityLabel="Avatar URL input"
              style={styles.input}
            />
            
            {/* Username Input */}
            <Input
              value={editedUsername}
              onChangeText={setEditedUsername}
              placeholder="Username"
              accessibilityLabel="Username input"
              style={styles.input}
            />
            
            {/* Validation Error */}
            {validationError && (
              <Text
                variant="bodySmall"
                style={styles.errorText}
                accessibilityLabel="Validation error"
              >
                {validationError}
              </Text>
            )}
          </>
        ) : (
          <>
            {profile?.avatar ? (
              <OptimizedImage
                uri={profile.avatar}
                width={96}
                height={96}
                borderRadius={48}
                priority="high"
                accessibilityLabel={`${profile.username}'s avatar`}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text variant="h2" style={styles.avatarInitials}>
                  {profile?.username.slice(0, 2).toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            <Text variant="h3" style={styles.username}>
              @{profile?.username || 'username'}
            </Text>
            {profile?.bio && (
              <Text variant="body" color="secondary" align="center" style={styles.bio}>
                {profile.bio}
              </Text>
            )}
          </>
        )}
      </View>

      {/* Edit Profile Button */}
      <View style={styles.editButtonContainer}>
        {isEditing ? (
          <View style={styles.editActions}>
            <Button
              variant="outline"
              size="md"
              onPress={handleCancelEdit}
              accessibilityLabel="Cancel editing"
              style={styles.actionButton}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onPress={handleSaveProfile}
              accessibilityLabel="Save profile changes"
              style={styles.actionButton}
              disabled={updateProfile.isPending}
            >
              {updateProfile.isPending ? (
                <ActivityIndicator size="small" color={colors.text.primary} />
              ) : (
                'Save'
              )}
            </Button>
          </View>
        ) : (
          <Button
            variant="outline"
            size="md"
            onPress={handleEditProfile}
            accessibilityLabel="Edit profile"
          >
            Edit Profile
          </Button>
        )}
      </View>

      {/* User Stats */}
      <Animated.View style={statsCardAnimatedStyle}>
        <Card style={styles.statsCard}>
          <Text variant="h4" style={styles.sectionTitle}>
            Stats
          </Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Animated.Text style={[styles.statValue, animatedMatchesStyle]}>
                {Math.round(matchesCount.value)}
              </Animated.Text>
              <Text variant="bodySmall" color="secondary">
                Matches
              </Text>
            </View>
            <View style={styles.statItem}>
              <Animated.Text style={[styles.statValue, animatedGamesStyle]}>
                {Math.round(gamesCount.value)}
              </Animated.Text>
              <Text variant="bodySmall" color="secondary">
                Games
              </Text>
            </View>
            <View style={styles.statItem}>
              <Animated.Text style={[styles.statValue, animatedWinRateStyle]}>
                {Math.round(winRateCount.value)}%
              </Animated.Text>
              <Text variant="bodySmall" color="secondary">
                Win Rate
              </Text>
            </View>
          </View>
        </Card>
      </Animated.View>

      {/* Music Taste */}
      {musicStats && (
        <Animated.View style={musicCardAnimatedStyle}>
          <Card style={styles.musicCard}>
          <Text variant="h4" style={styles.sectionTitle}>
            Music Taste
          </Text>

          {/* Top Artists */}
          {musicStats.topArtists.length > 0 && (
            <View style={styles.musicSection}>
              <Text variant="body" style={styles.musicSubtitle}>
                Top Artists
              </Text>
              <FlatList
                data={musicStats.topArtists.slice(0, 4)}
                renderItem={renderArtistItem}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.artistsList}
              />
            </View>
          )}

          {/* Top Tracks */}
          {musicStats.topTracks.length > 0 && (
            <View style={styles.musicSection}>
              <Text variant="body" style={styles.musicSubtitle}>
                Top Tracks
              </Text>
              {musicStats.topTracks.slice(0, 3).map((track) => (
                <View key={track.id} style={styles.trackItem}>
                  {track.artwork ? (
                    <OptimizedImage
                      uri={track.artwork}
                      width={48}
                      height={48}
                      borderRadius={8}
                      priority="low"
                      accessibilityLabel={`${track.title} artwork`}
                    />
                  ) : (
                    <View style={styles.trackArtworkPlaceholder}>
                      <Text variant="caption" color="secondary">
                        🎵
                      </Text>
                    </View>
                  )}
                  <View style={styles.trackInfo}>
                    <Text variant="bodySmall" numberOfLines={1}>
                      {track.title}
                    </Text>
                    <Text variant="caption" color="secondary" numberOfLines={1}>
                      {track.artist}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Top Genres */}
          {musicStats.topGenres.length > 0 && (
            <View style={styles.musicSection}>
              <Text variant="body" style={styles.musicSubtitle}>
                Top Genres
              </Text>
              <View style={styles.genresList}>
                {musicStats.topGenres.slice(0, 5).map((genre, index) => (
                  <View key={index} style={styles.genreBadge}>
                    <Text variant="caption" style={styles.genreText}>
                      {genre}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </Card>
      </Animated.View>
      )}

      {/* Match History */}
      {matchHistory.length > 0 && (
        <Animated.View style={historyCardAnimatedStyle}>
          <Card style={styles.historyCard}>
          <Text variant="h4" style={styles.sectionTitle}>
            Match History
          </Text>
          <FlatList
            data={matchHistory.slice(0, 5)}
            renderItem={renderMatchItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.matchList}
          />
        </Card>
      </Animated.View>
      )}

      {/* Empty State */}
      {!profile && (
        <View style={styles.emptyState}>
          <Text variant="body" color="secondary" align="center">
            Loading profile...
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

/**
 * Memoized Match Item Component (Requirement 15.4)
 */
const MatchItem = React.memo(function MatchItem({
  item,
  opponent,
  isWinner,
  myScore,
  opponentScore,
}: {
  item: Match;
  opponent: any;
  isWinner: boolean;
  myScore: number;
  opponentScore: number;
}) {
  return (
    <Card style={styles.matchCard}>
      <View style={styles.matchContent}>
        {/* Opponent Avatar */}
        {opponent?.avatar ? (
          <OptimizedImage
            uri={opponent.avatar}
            width={48}
            height={48}
            borderRadius={24}
            priority="low"
            accessibilityLabel={`${opponent.username}'s avatar`}
          />
        ) : (
          <View style={styles.opponentAvatarPlaceholder}>
            <Text variant="body" color="secondary">
              {opponent?.username.slice(0, 2).toUpperCase()}
            </Text>
          </View>
        )}

        {/* Match Info */}
        <View style={styles.matchInfo}>
          <Text variant="body" numberOfLines={1}>
            vs @{opponent?.username}
          </Text>
          <Text variant="bodySmall" color="secondary">
            {item.track.title} • {item.track.artist}
          </Text>
        </View>

        {/* Result */}
        <View style={styles.matchResult}>
          <Text
            variant="body"
            style={[
              styles.resultText,
              isWinner ? styles.winText : styles.loseText,
            ]}
          >
            {isWinner ? 'Won' : 'Lost'}
          </Text>
          <Text variant="bodySmall" color="secondary">
            {myScore}-{opponentScore}
          </Text>
        </View>
      </View>
    </Card>
  );
});

/**
 * Memoized Artist Item Component (Requirement 15.4)
 */
const ArtistItem = React.memo(function ArtistItem({ item }: { item: Artist }) {
  return (
    <View style={styles.artistItem}>
      {item.image ? (
        <OptimizedImage
          uri={item.image}
          width={64}
          height={64}
          borderRadius={32}
          priority="low"
          accessibilityLabel={`${item.name}'s image`}
        />
      ) : (
        <View style={styles.artistImagePlaceholder}>
          <Text variant="caption" color="secondary">
            🎤
          </Text>
        </View>
      )}
      <Text variant="caption" numberOfLines={1} style={styles.artistName}>
        {item.name}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[6],
    paddingBottom: spacing[8],
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.accent.purple,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  avatarInitials: {
    color: colors.text.primary,
    fontWeight: '700',
  },
  username: {
    fontWeight: '700',
    marginBottom: spacing[2],
  },
  bio: {
    marginTop: spacing[2],
    paddingHorizontal: spacing[4],
  },

  // Edit Button
  editButtonContainer: {
    marginBottom: spacing[5],
  },
  editActions: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  actionButton: {
    flex: 1,
  },
  input: {
    marginBottom: spacing[3],
  },
  editAvatarContainer: {
    marginBottom: spacing[3],
  },
  errorText: {
    color: colors.status.error,
    textAlign: 'center',
    marginBottom: spacing[3],
  },

  // Stats Card
  statsCard: {
    marginBottom: spacing[4],
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: spacing[4],
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: colors.accent.cyan,
    fontWeight: '700',
    marginBottom: spacing[1],
    fontSize: 32,
    lineHeight: 40,
  },

  // Music Card
  musicCard: {
    marginBottom: spacing[4],
  },
  musicSection: {
    marginBottom: spacing[4],
  },
  musicSubtitle: {
    fontWeight: '600',
    marginBottom: spacing[3],
  },

  // Artists
  artistsList: {
    gap: spacing[3],
  },
  artistItem: {
    alignItems: 'center',
    width: 80,
  },
  artistImagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  artistName: {
    textAlign: 'center',
  },

  // Tracks
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
    gap: spacing[3],
  },
  trackArtworkPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackInfo: {
    flex: 1,
  },

  // Genres
  genresList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  genreBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: colors.overlay.light,
    borderRadius: borderRadius.full,
  },
  genreText: {
    color: colors.accent.cyan,
    fontWeight: '600',
  },

  // Match History
  historyCard: {
    marginBottom: spacing[4],
  },
  matchList: {
    gap: spacing[3],
  },
  matchCard: {
    padding: spacing[3],
  },
  matchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  opponentAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchInfo: {
    flex: 1,
  },
  matchResult: {
    alignItems: 'flex-end',
  },
  resultText: {
    fontWeight: '700',
    marginBottom: spacing[1],
  },
  winText: {
    color: colors.status.success,
  },
  loseText: {
    color: colors.status.error,
  },

  // Empty State
  emptyState: {
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[6],
  },
});
