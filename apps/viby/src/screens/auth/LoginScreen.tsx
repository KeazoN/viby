/**
 * Login Screen
 * 
 * Handles OAuth provider selection (Spotify/Deezer) and initiates OAuth flow.
 * Receives provider from navigation params and opens OAuth URL in browser.
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Linking, Alert, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../app/navigation/types';
import { Button, Text } from '@viby/shared/design-system';
import { colors, spacing } from '@viby/shared/design-system';
import { authService } from '@viby/modules/auth';

type LoginScreenRouteProp = RouteProp<AuthStackParamList, 'Login'>;
type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export function LoginScreen() {
  const route = useRoute<LoginScreenRouteProp>();
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [isLoading, setIsLoading] = useState(false);
  const provider = route.params?.provider;

  useEffect(() => {
    // If provider is specified, initiate OAuth flow immediately
    if (provider) {
      initiateOAuthFlow(provider);
    }
  }, [provider]);

  const initiateOAuthFlow = async (selectedProvider: 'spotify' | 'deezer') => {
    try {
      setIsLoading(true);

      // Get OAuth URL from auth service
      const { authUrl } = await authService.initiateOAuth(selectedProvider);

      // Open OAuth URL in browser
      const canOpen = await Linking.canOpenURL(authUrl);
      if (canOpen) {
        await Linking.openURL(authUrl);
        
        // Note: The OAuth callback will be handled by deep linking
        // which will navigate to the OAuth screen with the code
      } else {
        throw new Error('Cannot open OAuth URL');
      }
    } catch (error) {
      console.error(`Failed to initiate ${selectedProvider} OAuth:`, error);
      Alert.alert(
        'Authentication Error',
        `Failed to start ${selectedProvider} login. Please try again.`,
        [
          {
            text: 'OK',
            onPress: () => {
              setIsLoading(false);
              navigation.goBack();
            },
          },
        ]
      );
    }
  };

  const handleSpotifyLogin = () => {
    initiateOAuthFlow('spotify');
  };

  const handleDeezerLogin = () => {
    initiateOAuthFlow('deezer');
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  // If provider is specified and loading, show loading state
  if (provider && isLoading) {
    return (
      <View style={styles.container} testID="login-screen-loading">
        <View style={styles.loadingSection}>
          <ActivityIndicator size="large" color={colors.primary.default} testID="oauth-loading-indicator" />
          <Text variant="body1" color="secondary" align="center" style={styles.loadingText}>
            Opening {provider === 'spotify' ? 'Spotify' : 'Deezer'} login...
          </Text>
        </View>
      </View>
    );
  }

  // If no provider specified, show provider selection
  return (
    <View style={styles.container} testID="login-screen">
      {/* Header Section */}
      <View style={styles.headerSection}>
        <Text variant="h2" align="center" style={styles.title}>
          Choose Your Music Provider
        </Text>
        <Text variant="body1" color="secondary" align="center" style={styles.subtitle}>
          Connect your music streaming account to get started
        </Text>
      </View>

      {/* Provider Selection Section */}
      <View style={styles.buttonSection}>
        <Button
          variant="primary"
          size="lg"
          onPress={handleSpotifyLogin}
          fullWidth
          disabled={isLoading}
          testID="button-spotify-login"
          accessibilityLabel="Login with Spotify"
        >
          {isLoading ? 'Connecting...' : 'Continue with Spotify'}
        </Button>

        <View style={styles.deezerButton}>
          <Button
            variant="primary"
            size="lg"
            onPress={handleDeezerLogin}
            fullWidth
            disabled={isLoading}
            testID="button-deezer-login"
            accessibilityLabel="Login with Deezer"
          >
            {isLoading ? 'Connecting...' : 'Continue with Deezer'}
          </Button>
        </View>

        <View style={styles.backButton}>
          <Button
            variant="ghost"
            size="md"
            onPress={handleGoBack}
            fullWidth
            disabled={isLoading}
            testID="button-back"
            accessibilityLabel="Go back"
          >
            Back
          </Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    paddingHorizontal: spacing[6],
  },
  headerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
  },
  title: {
    marginBottom: spacing[3],
  },
  subtitle: {
    textAlign: 'center',
  },
  buttonSection: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: spacing[8],
  },
  deezerButton: {
    marginTop: spacing[4],
  },
  backButton: {
    marginTop: spacing[6],
  },
  loadingSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing[4],
  },
});
