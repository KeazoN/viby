/**
 * Settings Screen
 * 
 * Displays app settings including notification preferences, privacy options,
 * connected accounts, and logout functionality.
 * 
 * Requirements: 12.5, 12.6
 * - 12.5: Display user preferences including notification settings and privacy options
 * - 12.6: Allow users to disconnect their Spotify or Deezer account
 */

import { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/navigation/types';
import { Text, Card, Button } from '@viby/shared/design-system';
import { colors, spacing } from '@viby/shared/design-system';
import { useProfile, useUpdateProfile } from '@viby/modules/profile';
import { useAuthStore } from '@viby/modules/auth';

type SettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function SettingsScreen() {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const { profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const logout = useAuthStore((state) => state.logout);

  // Local state for settings
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    profile?.preferences?.notificationsEnabled ?? true
  );
  const [matchNotifications, setMatchNotifications] = useState(
    profile?.preferences?.matchNotifications ?? true
  );
  const [messageNotifications, setMessageNotifications] = useState(
    profile?.preferences?.messageNotifications ?? true
  );
  const [privacyMode, setPrivacyMode] = useState<'public' | 'friends' | 'private'>(
    profile?.preferences?.privacyMode ?? 'public'
  );

  const handleNotificationsToggle = async (value: boolean) => {
    setNotificationsEnabled(value);
    try {
      await updateProfile.mutateAsync({
        preferences: {
          ...profile?.preferences,
          notificationsEnabled: value,
        },
      });
    } catch (error) {
      // Revert on error
      setNotificationsEnabled(!value);
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  const handleMatchNotificationsToggle = async (value: boolean) => {
    setMatchNotifications(value);
    try {
      await updateProfile.mutateAsync({
        preferences: {
          ...profile?.preferences,
          matchNotifications: value,
        },
      });
    } catch (error) {
      setMatchNotifications(!value);
      Alert.alert('Error', 'Failed to update match notification settings');
    }
  };

  const handleMessageNotificationsToggle = async (value: boolean) => {
    setMessageNotifications(value);
    try {
      await updateProfile.mutateAsync({
        preferences: {
          ...profile?.preferences,
          messageNotifications: value,
        },
      });
    } catch (error) {
      setMessageNotifications(!value);
      Alert.alert('Error', 'Failed to update message notification settings');
    }
  };

  const handlePrivacyModeToggle = async (value: boolean) => {
    const newMode = value ? 'private' : 'public';
    setPrivacyMode(newMode);
    try {
      await updateProfile.mutateAsync({
        preferences: {
          ...profile?.preferences,
          privacyMode: newMode,
        },
      });
    } catch (error) {
      setPrivacyMode(value ? 'public' : 'private');
      Alert.alert('Error', 'Failed to update privacy settings');
    }
  };

  const handleDisconnectSpotify = () => {
    Alert.alert(
      'Disconnect Spotify',
      'Are you sure you want to disconnect your Spotify account? You will need to reconnect to continue using the app.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            // Note: Account disconnection is not yet implemented in the backend API
            // This is a placeholder for future implementation
            Alert.alert(
              'Not Implemented',
              'Account disconnection is not yet available. Please contact support to disconnect your account.'
            );
          },
        },
      ]
    );
  };

  const handleDisconnectDeezer = () => {
    Alert.alert(
      'Disconnect Deezer',
      'Are you sure you want to disconnect your Deezer account? You will need to reconnect to continue using the app.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            // Note: Account disconnection is not yet implemented in the backend API
            // This is a placeholder for future implementation
            Alert.alert(
              'Not Implemented',
              'Account disconnection is not yet available. Please contact support to disconnect your account.'
            );
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Notification Settings */}
      <Card style={styles.card}>
        <Text variant="h4" style={styles.sectionTitle}>
          Notifications
        </Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text variant="body">Enable Notifications</Text>
            <Text variant="caption" color="secondary">
              Receive notifications for matches and messages
            </Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleNotificationsToggle}
            accessibilityLabel="Toggle notifications"
            trackColor={{ false: colors.background.tertiary, true: colors.accent.cyan }}
            thumbColor={colors.text.primary}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text variant="body">Match Notifications</Text>
            <Text variant="caption" color="secondary">
              Get notified when you match with someone
            </Text>
          </View>
          <Switch
            value={matchNotifications}
            onValueChange={handleMatchNotificationsToggle}
            disabled={!notificationsEnabled}
            accessibilityLabel="Toggle match notifications"
            trackColor={{ false: colors.background.tertiary, true: colors.accent.cyan }}
            thumbColor={colors.text.primary}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text variant="body">Message Notifications</Text>
            <Text variant="caption" color="secondary">
              Get notified when you receive messages
            </Text>
          </View>
          <Switch
            value={messageNotifications}
            onValueChange={handleMessageNotificationsToggle}
            disabled={!notificationsEnabled}
            accessibilityLabel="Toggle message notifications"
            trackColor={{ false: colors.background.tertiary, true: colors.accent.cyan }}
            thumbColor={colors.text.primary}
          />
        </View>
      </Card>

      {/* Privacy Options */}
      <Card style={styles.card}>
        <Text variant="h4" style={styles.sectionTitle}>
          Privacy
        </Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text variant="body">Privacy Mode</Text>
            <Text variant="caption" color="secondary">
              {privacyMode === 'private'
                ? 'Your profile is hidden from discovery'
                : 'Your profile is visible to others'}
            </Text>
          </View>
          <Switch
            value={privacyMode === 'private'}
            onValueChange={handlePrivacyModeToggle}
            accessibilityLabel="Toggle privacy mode"
            trackColor={{ false: colors.background.tertiary, true: colors.accent.purple }}
            thumbColor={colors.text.primary}
          />
        </View>
      </Card>

      {/* Connected Accounts */}
      <Card style={styles.card}>
        <Text variant="h4" style={styles.sectionTitle}>
          Connected Accounts
        </Text>

        {/* Spotify Account */}
        <View style={styles.accountRow}>
          <View style={styles.accountInfo}>
            <Text variant="body">Spotify</Text>
            <Text variant="caption" color="secondary">
              {profile?.spotifyLinked ? 'Connected' : 'Not connected'}
            </Text>
          </View>
          {profile?.spotifyLinked && (
            <Button
              variant="secondary"
              size="sm"
              onPress={handleDisconnectSpotify}
              accessibilityLabel="Disconnect Spotify account"
            >
              Disconnect
            </Button>
          )}
        </View>

        {/* Deezer Account */}
        <View style={styles.accountRow}>
          <View style={styles.accountInfo}>
            <Text variant="body">Deezer</Text>
            <Text variant="caption" color="secondary">
              {profile?.deezerLinked ? 'Connected' : 'Not connected'}
            </Text>
          </View>
          {profile?.deezerLinked && (
            <Button
              variant="secondary"
              size="sm"
              onPress={handleDisconnectDeezer}
              accessibilityLabel="Disconnect Deezer account"
            >
              Disconnect
            </Button>
          )}
        </View>
      </Card>

      {/* Logout Button */}
      <View style={styles.logoutContainer}>
        <Button
          variant="secondary"
          size="md"
          onPress={handleLogout}
          accessibilityLabel="Logout button"
        >
          Logout
        </Button>
      </View>

      {/* Legal Documents */}
      <Card style={styles.card}>
        <Text variant="h4" style={styles.sectionTitle}>
          Legal
        </Text>

        <TouchableOpacity
          style={styles.legalRow}
          onPress={() => navigation.navigate('LegalDocument', { documentType: 'privacy-policy' })}
          accessibilityLabel="View privacy policy"
          testID="button-privacy-policy"
        >
          <Text variant="body">Privacy Policy</Text>
          <Text variant="body" color="secondary">›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.legalRow}
          onPress={() => navigation.navigate('LegalDocument', { documentType: 'terms-of-service' })}
          accessibilityLabel="View terms of service"
          testID="button-terms-of-service"
        >
          <Text variant="body">Terms of Service</Text>
          <Text variant="body" color="secondary">›</Text>
        </TouchableOpacity>
      </Card>

      {/* Empty State */}
      {!profile && (
        <View style={styles.emptyState}>
          <Text variant="body" color="secondary" align="center">
            Loading settings...
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

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

  // Card
  card: {
    marginBottom: spacing[4],
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: spacing[4],
  },

  // Setting Row
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.background.tertiary,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing[3],
  },

  // Account Row
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.background.tertiary,
  },
  accountInfo: {
    flex: 1,
    marginRight: spacing[3],
  },

  // Logout
  logoutContainer: {
    marginTop: spacing[4],
  },

  // Legal
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.background.tertiary,
  },

  // Empty State
  emptyState: {
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[6],
  },
});
