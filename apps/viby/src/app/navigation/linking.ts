/**
 * Deep Linking Configuration
 * 
 * Configures URL schemes and path mappings for deep linking.
 * Supports opening specific screens from external links or notifications.
 * 
 * Authentication checks are handled by NavigationContainer.
 * 
 */

import type { LinkingOptions } from '@react-navigation/native';
import type { RootStackParamList } from './types';

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [
    'viby://',
    'https://viby.app',
    'https://*.viby.app',
  ],
  config: {
    screens: {
      Auth: {
        screens: {
          Welcome: 'welcome',
          Login: 'login',
          OAuth: 'oauth/callback',
          Onboarding: 'onboarding',
        },
      },
      Main: {
        screens: {
          Discovery: 'discovery',
          Profile: 'profile/:userId?',
          Settings: 'settings',
        },
      },
      Match: 'match/:matchId',
      Game: 'game/:roomId',
      Chat: 'chat/:roomId',
    },
  },
};

export default linking;
