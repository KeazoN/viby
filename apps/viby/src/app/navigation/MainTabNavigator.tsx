/**
 * Main Tab Navigator
 * 
 * Bottom tab navigation for authenticated users:
 * - Discovery: See who's listening to the same music
 * - Profile: View and edit user profile
 * - Settings: App settings and preferences
 * 
 * Uses lazy loading with Suspense for code splitting.
 */

import React, { Suspense } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from './types';
import {
  DiscoveryScreen,
  ProfileScreen,
  SettingsScreen,
} from '../../screens/main';
import { LoadingFallback } from '../components/LoadingFallback';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1a1a1a',
          borderTopColor: '#2a2a2a',
        },
        tabBarActiveTintColor: '#00ff88',
        tabBarInactiveTintColor: '#666666',
      }}
    >
      <Tab.Screen
        name="Discovery"
        options={{
          tabBarLabel: 'Discovery',
          tabBarIcon: ({ color, size }) => null, // Will add icons later
          tabBarTestID: 'discovery-tab',
        }}
      >
        {(props) => (
          <Suspense fallback={<LoadingFallback />}>
            <DiscoveryScreen {...props} />
          </Suspense>
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Profile"
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => null,
          tabBarTestID: 'profile-tab',
        }}
      >
        {(props) => (
          <Suspense fallback={<LoadingFallback />}>
            <ProfileScreen {...props} />
          </Suspense>
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Settings"
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => null,
        }}
      >
        {(props) => (
          <Suspense fallback={<LoadingFallback />}>
            <SettingsScreen {...props} />
          </Suspense>
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
