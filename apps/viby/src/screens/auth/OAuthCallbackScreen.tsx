/**
 * OAuth Callback Screen
 * 
 * Handles OAuth callback with authorization code, exchanges it for tokens,
 * and navigates to onboarding or main app based on user status.
 * 
 * Requirements: 2.1, 2.2
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../app/navigation/types';
import { Text } from '@viby/shared/design-system';
import { colors, spacing } from '@viby/shared/design-system';
import { authService, useAuthStore } from '@viby/modules/auth';

type OAuthCallbackScreenRouteProp = RouteProp<AuthStackParamList, 'OAuth'>;
type OAuthCallbackScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'OAuth'>;

export function OAuthCallbackScreen() {
  const route = useRoute<OAuthCallbackScreenRouteProp>();
  const navigation = useNavigation<OAuthCallbackScreenNavigationProp>();
  const { login } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  const { code, provider } = route.params;

  useEffect(() => {
    handleOAuthCallback();
  }, [code, provider]);

  const handleOAuthCallback = async () => {
    try {
      // Exchange authorization code for tokens
      const response = await authService.handleOAuthCallback(code, provider);

      // Update auth store with user data and tokens
      login(
        {
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          expiresIn: response.expiresIn,
        },
        response.user
      );

      // Navigate to onboarding for new users or main app for returning users
      // For now, we'll navigate to onboarding - this can be enhanced later
      // to check if user has completed onboarding
      navigation.reset({
        index: 0,
        routes: [{ name: 'Onboarding' }],
      });
    } catch (err) {
      console.error('OAuth callback error:', err);
      
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to complete authentication';
      
      setError(errorMessage);

      // Show error alert and navigate back to welcome screen
      Alert.alert(
        'Authentication Failed',
        errorMessage,
        [
          {
            text: 'Try Again',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Welcome' }],
              });
            },
          },
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary.default} />
      <Text variant="body1" color="secondary" align="center" style={styles.text}>
        {error ? 'Authentication failed...' : 'Completing authentication...'}
      </Text>
      {error && (
        <Text variant="caption" color="error" align="center" style={styles.errorText}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    paddingHorizontal: spacing[6],
  },
  text: {
    marginTop: spacing[4],
  },
  errorText: {
    marginTop: spacing[2],
  },
});
