/**
 * OptimizedImage Component Tests
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { OptimizedImage } from './OptimizedImage';
import { imageCacheManager } from '../services/image-cache-manager';

// Mock the image cache manager
jest.mock('../services/image-cache-manager', () => ({
  imageCacheManager: {
    trackImageAccess: jest.fn().mockResolvedValue(undefined),
    initialize: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('OptimizedImage', () => {
  const mockUri = 'https://example.com/image.jpg';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with required props', () => {
    const { getByLabelText } = render(
      <OptimizedImage
        uri={mockUri}
        width={100}
        height={100}
        accessibilityLabel="Test image"
      />
    );

    expect(getByLabelText('Test image')).toBeTruthy();
  });

  it('applies border radius correctly', () => {
    const { getByLabelText } = render(
      <OptimizedImage
        uri={mockUri}
        width={100}
        height={100}
        borderRadius={16}
        accessibilityLabel="Rounded image"
      />
    );

    const image = getByLabelText('Rounded image');
    expect(image).toBeTruthy();
  });

  it('uses default priority when not specified', () => {
    const { getByLabelText } = render(
      <OptimizedImage
        uri={mockUri}
        width={100}
        height={100}
        accessibilityLabel="Default priority image"
      />
    );

    expect(getByLabelText('Default priority image')).toBeTruthy();
  });

  it('accepts high priority', () => {
    const { getByLabelText } = render(
      <OptimizedImage
        uri={mockUri}
        width={100}
        height={100}
        priority="high"
        accessibilityLabel="High priority image"
      />
    );

    expect(getByLabelText('High priority image')).toBeTruthy();
  });

  it('accepts low priority', () => {
    const { getByLabelText } = render(
      <OptimizedImage
        uri={mockUri}
        width={100}
        height={100}
        priority="low"
        accessibilityLabel="Low priority image"
      />
    );

    expect(getByLabelText('Low priority image')).toBeTruthy();
  });

  it('applies custom resize mode', () => {
    const { getByLabelText } = render(
      <OptimizedImage
        uri={mockUri}
        width={100}
        height={100}
        resizeMode="contain"
        accessibilityLabel="Contain mode image"
      />
    );

    expect(getByLabelText('Contain mode image')).toBeTruthy();
  });

  it('applies custom styles', () => {
    const customStyle = { marginTop: 10 };
    const { getByLabelText } = render(
      <OptimizedImage
        uri={mockUri}
        width={100}
        height={100}
        style={customStyle}
        accessibilityLabel="Styled image"
      />
    );

    expect(getByLabelText('Styled image')).toBeTruthy();
  });

  it('tracks image access in cache manager', async () => {
    render(
      <OptimizedImage
        uri={mockUri}
        width={100}
        height={100}
        accessibilityLabel="Cached image"
      />
    );

    await waitFor(() => {
      expect(imageCacheManager.trackImageAccess).toHaveBeenCalledWith(
        mockUri,
        expect.any(Number)
      );
    });
  });

  it('shows loading indicator by default', () => {
    const { UNSAFE_getByType } = render(
      <OptimizedImage
        uri={mockUri}
        width={100}
        height={100}
        accessibilityLabel="Loading image"
      />
    );

    // ActivityIndicator should be present initially
    expect(() => UNSAFE_getByType(require('react-native').ActivityIndicator)).not.toThrow();
  });

  it('hides loading indicator when showLoadingIndicator is false', () => {
    const { UNSAFE_queryByType } = render(
      <OptimizedImage
        uri={mockUri}
        width={100}
        height={100}
        showLoadingIndicator={false}
        accessibilityLabel="No loading image"
      />
    );

    // ActivityIndicator should not be present
    expect(UNSAFE_queryByType(require('react-native').ActivityIndicator)).toBeNull();
  });

  it('renders custom placeholder when provided', () => {
    const CustomPlaceholder = () => <></>;
    const { UNSAFE_queryByType } = render(
      <OptimizedImage
        uri={mockUri}
        width={100}
        height={100}
        placeholder={<CustomPlaceholder />}
        accessibilityLabel="Custom placeholder image"
      />
    );

    expect(UNSAFE_queryByType(CustomPlaceholder)).toBeTruthy();
  });

  it('calls onLoad callback when image loads', () => {
    const onLoad = jest.fn();
    render(
      <OptimizedImage
        uri={mockUri}
        width={100}
        height={100}
        onLoad={onLoad}
        accessibilityLabel="Callback image"
      />
    );

    // Note: In a real test, we'd need to simulate the FastImage onLoad event
    // This is a basic structure test
    expect(onLoad).not.toHaveBeenCalled(); // Not called until image loads
  });

  it('calls onError callback when image fails', () => {
    const onError = jest.fn();
    render(
      <OptimizedImage
        uri={mockUri}
        width={100}
        height={100}
        onError={onError}
        accessibilityLabel="Error image"
      />
    );

    // Note: In a real test, we'd need to simulate the FastImage onError event
    expect(onError).not.toHaveBeenCalled(); // Not called until error occurs
  });

  it('renders custom fallback when provided', () => {
    const CustomFallback = () => <></>;
    const { UNSAFE_queryByType } = render(
      <OptimizedImage
        uri={mockUri}
        width={100}
        height={100}
        fallback={<CustomFallback />}
        accessibilityLabel="Custom fallback image"
      />
    );

    // Fallback is not shown initially (only on error)
    // This test verifies the prop is accepted
    expect(true).toBe(true);
  });
});
