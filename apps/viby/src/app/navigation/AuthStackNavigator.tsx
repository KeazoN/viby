/**
 * Auth Stack Navigator
 * 
 * Handles the authentication flow:
 * Welcome → Login → OAuth → Onboarding
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AuthStackParamList } from './types';
import {
  WelcomeScreen,
  LoginScreen,
  OAuthCallbackScreen,
  OnboardingScreen,
} from '../../screens/auth';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="OAuth" component={OAuthCallbackScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
    </Stack.Navigator>
  );
}
