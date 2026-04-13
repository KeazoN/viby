/**
 * Root Stack Navigator
 * 
 * Top-level navigator that manages:
 * - Auth flow (for unauthenticated users)
 * - Main app (for authenticated users)
 * - Modal screens (Match, Game, Chat)
 * 
 * Uses lazy loading with Suspense for code splitting.
 */

import React, { Suspense } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { AuthStackNavigator } from './AuthStackNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { MatchScreen, GameScreen, ChatScreen } from '../../screens/modals';
import { LegalDocumentScreen } from '../../screens/legal/LegalDocumentScreen';
import { LoadingFallback } from '../components/LoadingFallback';

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
        <>
          <Stack.Screen name="Auth" component={AuthStackNavigator} />
          
          {/* Legal documents accessible during auth flow */}
          <Stack.Screen
            name="LegalDocument"
            component={LegalDocumentScreen}
            options={{
              presentation: 'modal',
              headerShown: true,
              headerTitle: '',
              headerBackTitle: 'Back',
            }}
          />
        </>
      ) : (
        // Main app for authenticated users
        <>
          <Stack.Screen name="Main" component={MainTabNavigator} />
          
          {/* Modal screens with lazy loading */}
          <Stack.Screen
            name="Match"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          >
            {(props) => (
              <Suspense fallback={<LoadingFallback />}>
                <MatchScreen {...props} />
              </Suspense>
            )}
          </Stack.Screen>
          <Stack.Screen
            name="Game"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          >
            {(props) => (
              <Suspense fallback={<LoadingFallback />}>
                <GameScreen {...props} />
              </Suspense>
            )}
          </Stack.Screen>
          <Stack.Screen
            name="Chat"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          >
            {(props) => (
              <Suspense fallback={<LoadingFallback />}>
                <ChatScreen {...props} />
              </Suspense>
            )}
          </Stack.Screen>
          
          {/* Legal documents accessible from settings */}
          <Stack.Screen
            name="LegalDocument"
            component={LegalDocumentScreen}
            options={{
              presentation: 'modal',
              headerShown: true,
              headerTitle: '',
              headerBackTitle: 'Back',
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
