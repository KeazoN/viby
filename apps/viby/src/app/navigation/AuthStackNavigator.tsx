/**
 * Auth Stack Navigator
 * 
 * Handles the authentication flow:
 * Welcome → Login → OAuth → Onboarding
 * 
 * Uses lazy loading with Suspense for code splitting.
 */

import React, { Suspense } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AuthStackParamList } from './types';
import {
  WelcomeScreen,
  LoginScreen,
  OAuthCallbackScreen,
  OnboardingScreen,
} from '../../screens/auth';
import { LoadingFallback } from '../components/LoadingFallback';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <Stack.Screen name="Welcome">
        {(props) => (
          <Suspense fallback={<LoadingFallback />}>
            <WelcomeScreen {...props} />
          </Suspense>
        )}
      </Stack.Screen>
      <Stack.Screen name="Login">
        {(props) => (
          <Suspense fallback={<LoadingFallback />}>
            <LoginScreen {...props} />
          </Suspense>
        )}
      </Stack.Screen>
      <Stack.Screen name="OAuth">
        {(props) => (
          <Suspense fallback={<LoadingFallback />}>
            <OAuthCallbackScreen {...props} />
          </Suspense>
        )}
      </Stack.Screen>
      <Stack.Screen name="Onboarding">
        {(props) => (
          <Suspense fallback={<LoadingFallback />}>
            <OnboardingScreen {...props} />
          </Suspense>
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
