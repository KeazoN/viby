/**
 * LoadingFallback Component Tests
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { LoadingFallback } from './LoadingFallback';

describe('LoadingFallback', () => {
  it('renders loading indicator', () => {
    const { getByTestId } = render(<LoadingFallback />);
    
    // ActivityIndicator should be present
    expect(() => getByTestId('loading-indicator')).not.toThrow();
  });

  it('has correct background color', () => {
    const { getByTestId } = render(<LoadingFallback />);
    
    const container = getByTestId('loading-container');
    expect(container.props.style).toMatchObject({
      backgroundColor: '#0a0a0a',
    });
  });

  it('centers content', () => {
    const { getByTestId } = render(<LoadingFallback />);
    
    const container = getByTestId('loading-container');
    expect(container.props.style).toMatchObject({
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    });
  });
});
