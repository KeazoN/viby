/**
 * Viby Mobile App
 * 
 * Root application component that sets up:
 * - Navigation structure
 * - Authentication state
 * - Global providers
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from './navigation';
import { useAuthStore } from '@viby/modules/auth';

export const App = () => {
  // Get authentication state from Zustand store
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <>
      <StatusBar barStyle="light-content" />
      <NavigationContainer isAuthenticated={isAuthenticated} />
    </>
  );
};

export default App;
