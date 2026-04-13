/**
 * usePrefetchImages Hook Tests
 */

import { renderHook } from '@testing-library/react-native';
import { usePrefetchImages, usePrefetchTrackArtwork } from './use-prefetch-images';
import FastImage from 'react-native-fast-image';

// Mock FastImage
jest.mock('react-native-fast-image', () => ({
  preload: jest.fn(),
  priority: {
    low: 'low',
    normal: 'normal',
    high: 'high',
  },
}));

describe('usePrefetchImages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('prefetches images with default priority', () => {
    const uris = ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'];

    renderHook(() => usePrefetchImages({ uris }));

    expect(FastImage.preload).toHaveBeenCalledWith([
      { uri: uris[0], priority: 'low' },
      { uri: uris[1], priority: 'low' },
    ]);
  });

  it('prefetches images with custom priority', () => {
    const uris = ['https://example.com/image1.jpg'];

    renderHook(() => usePrefetchImages({ uris, priority: 'high' }));

    expect(FastImage.preload).toHaveBeenCalledWith([
      { uri: uris[0], priority: 'high' },
    ]);
  });

  it('filters out empty URIs', () => {
    const uris = ['https://example.com/image1.jpg', '', 'https://example.com/image2.jpg'];

    renderHook(() => usePrefetchImages({ uris }));

    expect(FastImage.preload).toHaveBeenCalledWith([
      { uri: 'https://example.com/image1.jpg', priority: 'low' },
      { uri: 'https://example.com/image2.jpg', priority: 'low' },
    ]);
  });

  it('does not prefetch when uris array is empty', () => {
    renderHook(() => usePrefetchImages({ uris: [] }));

    expect(FastImage.preload).not.toHaveBeenCalled();
  });

  it('re-prefetches when uris change', () => {
    const { rerender } = renderHook(
      ({ uris }) => usePrefetchImages({ uris }),
      { initialProps: { uris: ['https://example.com/image1.jpg'] } }
    );

    expect(FastImage.preload).toHaveBeenCalledTimes(1);

    rerender({ uris: ['https://example.com/image2.jpg'] });

    expect(FastImage.preload).toHaveBeenCalledTimes(2);
  });
});

describe('usePrefetchTrackArtwork', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('prefetches track artwork from clusters', () => {
    const clusters = [
      { track: { artwork: 'https://example.com/artwork1.jpg' } },
      { track: { artwork: 'https://example.com/artwork2.jpg' } },
    ];

    renderHook(() => usePrefetchTrackArtwork(clusters));

    expect(FastImage.preload).toHaveBeenCalledWith([
      { uri: 'https://example.com/artwork1.jpg', priority: 'low' },
      { uri: 'https://example.com/artwork2.jpg', priority: 'low' },
    ]);
  });

  it('filters out clusters without artwork', () => {
    const clusters = [
      { track: { artwork: 'https://example.com/artwork1.jpg' } },
      { track: {} },
      { track: { artwork: 'https://example.com/artwork2.jpg' } },
    ];

    renderHook(() => usePrefetchTrackArtwork(clusters));

    expect(FastImage.preload).toHaveBeenCalledWith([
      { uri: 'https://example.com/artwork1.jpg', priority: 'low' },
      { uri: 'https://example.com/artwork2.jpg', priority: 'low' },
    ]);
  });

  it('handles empty clusters array', () => {
    renderHook(() => usePrefetchTrackArtwork([]));

    expect(FastImage.preload).not.toHaveBeenCalled();
  });
});
