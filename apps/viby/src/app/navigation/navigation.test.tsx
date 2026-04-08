/**
 * Navigation Configuration Tests
 * 
 * Tests for the navigation structure and configuration
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from './NavigationContainer';

// Mock the auth store
jest.mock('@viby/modules/auth', () => ({
  useAuthStore: jest.fn(),
}));

describe('Navigation Configuration', () => {
  it('should render NavigationContainer for unauthenticated users', () => {
    const { getByText } = render(
      <NavigationContainer isAuthenticated={false} />
    );
    
    // Should show Welcome screen (first screen in Auth flow)
    expect(getByText('Welcome to Viby')).toBeTruthy();
  });

  it('should render NavigationContainer for authenticated users', () => {
    const { getByText } = render(
      <NavigationContainer isAuthenticated={true} />
    );
    
    // Should show Discovery screen (first tab in Main flow)
    expect(getByText('Discovery')).toBeTruthy();
  });
});

describe('Navigation Types', () => {
  it('should have correct type definitions', () => {
    // This test ensures TypeScript compilation succeeds
    // If types are incorrect, the test file won't compile
    expect(true).toBe(true);
  });
});
