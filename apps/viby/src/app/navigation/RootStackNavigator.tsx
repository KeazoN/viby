/**
 * Root Stack Navigator
 * 
 * Top-level navigator that manages:
 * - Auth flow (for unauthenticated users)
 * - Main app (for authenticated users)
 * - Modal screens (Match, Game, Chat)
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { AuthStackNavigator } from './AuthStackNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { MatchScreen, GameScreen, ChatScreen } from '../../screens/modals';

const Stack = createNativeStackNavigator<RootStackParamList>();

interface RootStackNavigatorProps {
  isAuthenticated: boolean;
}

export function RootStackNavigator({ isAuthenticated }: RootStackNavigatorProps) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {!isAuthenticated ? (
        // Auth flow for unauthenticated users
        <Stack.Screen name="Auth" component={AuthStackNavigator} />
      ) : (
        // Main app for authenticated users
        <>
          <Stack.Screen name="Main" component={MainTabNavigator} />
          
          {/* Modal screens */}
          <Stack.Screen
            name="Match"
            component={MatchScreen}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="Game"
            component={GameScreen}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
