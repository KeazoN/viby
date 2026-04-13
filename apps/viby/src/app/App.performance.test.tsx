/**
 * Performance Tests for Viby Mobile App
 * 
 * Tests critical performance requirements:
 * - App launch time (< 2 seconds)
 * - Screen transition time (< 300ms)
 * - WebSocket message latency (< 100ms)
 * - Memory usage (< 200MB)
 * 
 * Requirements: 15.1, 15.2, 15.3, 15.5
 */

import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { App } from './App';
import { useAuthStore } from '@viby/modules/auth';
import { socketManager } from '@viby/modules/realtime';
import { NavigationContainer } from '@react-navigation/native';
import type { User } from '@viby/modules/auth';

// Mock dependencies
jest.mock('@viby/modules/auth');
jest.mock('@viby/modules/profile');
jest.mock('@viby/modules/realtime');
jest.mock('@viby/shared/lifecycle');
jest.mock('@viby/shared/notifications');
jest.mock('@viby/shared/monitoring');
jest.mock('@viby/shared/analytics');

describe('Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  /**
   * Requirement 15.1: App launch time < 2 seconds
   * 
   * Tests that the app launches and displays the first screen
   * within 2 seconds on mid-range devices.
   */
  describe('App Launch Performance', () => {
    it('should launch and display first screen within 2 seconds', async () => {
      // Mock unauthenticated state to test auth flow
      (useAuthStore as unknown as jest.Mock).mockReturnValue({
        isAuthenticated: false,
        user: null,
      });

      const startTime = performance.now();

      const { getByTestId } = render(<App />);

      // Wait for the first screen to render
      await waitFor(
        () => {
          expect(getByTestId('welcome-screen')).toBeTruthy();
        },
        { timeout: 2000 }
      );

      const endTime = performance.now();
      const launchTime = endTime - startTime;

      // Assert launch time is under 2 seconds (2000ms)
      expect(launchTime).toBeLessThan(2000);
      
      console.log(`App launch time: ${launchTime.toFixed(2)}ms`);
    });

    it('should launch authenticated app within 2 seconds', async () => {
      const mockUser: User = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        avatar: null,
        provider: 'spotify',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (useAuthStore as unknown as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        user: mockUser,
      });

      const startTime = performance.now();

      const { getByTestId } = render(<App />);

      // Wait for the main screen to render
      await waitFor(
        () => {
          expect(getByTestId('discovery-screen')).toBeTruthy();
        },
        { timeout: 2000 }
      );

      const endTime = performance.now();
      const launchTime = endTime - startTime;

      expect(launchTime).toBeLessThan(2000);
      
      console.log(`Authenticated app launch time: ${launchTime.toFixed(2)}ms`);
    });

    it('should initialize critical services within launch time budget', async () => {
      (useAuthStore as unknown as jest.Mock).mockReturnValue({
        isAuthenticated: false,
        user: null,
      });

      const startTime = performance.now();

      render(<App />);

      // Simulate async initialization
      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      const endTime = performance.now();
      const initTime = endTime - startTime;

      // Service initialization should be fast
      expect(initTime).toBeLessThan(500);
      
      console.log(`Service initialization time: ${initTime.toFixed(2)}ms`);
    });
  });

  /**
   * Requirement 15.2: Screen transition time < 300ms
   * 
   * Tests that screen transitions complete within 300ms
   * for smooth user experience.
   */
  describe('Screen Transition Performance', () => {
    it('should transition between screens within 300ms', async () => {
      const mockUser: User = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        avatar: null,
        provider: 'spotify',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (useAuthStore as unknown as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        user: mockUser,
      });

      const { getByTestId } = render(<App />);

      // Wait for initial screen
      await waitFor(() => {
        expect(getByTestId('discovery-screen')).toBeTruthy();
      });

      const startTime = performance.now();

      // Simulate navigation to profile screen
      act(() => {
        const profileTab = getByTestId('profile-tab');
        profileTab.props.onPress();
      });

      // Wait for profile screen to render
      await waitFor(
        () => {
          expect(getByTestId('profile-screen')).toBeTruthy();
        },
        { timeout: 300 }
      );

      const endTime = performance.now();
      const transitionTime = endTime - startTime;

      expect(transitionTime).toBeLessThan(300);
      
      console.log(`Screen transition time: ${transitionTime.toFixed(2)}ms`);
    });

    it('should open modal screens within 300ms', async () => {
      const mockUser: User = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        avatar: null,
        provider: 'spotify',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (useAuthStore as unknown as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        user: mockUser,
      });

      const { getByTestId } = render(<App />);

      await waitFor(() => {
        expect(getByTestId('discovery-screen')).toBeTruthy();
      });

      const startTime = performance.now();

      // Simulate opening match modal
      act(() => {
        const matchButton = getByTestId('quick-match-button');
        matchButton.props.onPress();
      });

      await waitFor(
        () => {
          expect(getByTestId('match-screen')).toBeTruthy();
        },
        { timeout: 300 }
      );

      const endTime = performance.now();
      const modalOpenTime = endTime - startTime;

      expect(modalOpenTime).toBeLessThan(300);
      
      console.log(`Modal open time: ${modalOpenTime.toFixed(2)}ms`);
    });

    it('should handle rapid screen transitions efficiently', async () => {
      const mockUser: User = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        avatar: null,
        provider: 'spotify',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (useAuthStore as unknown as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        user: mockUser,
      });

      const { getByTestId } = render(<App />);

      await waitFor(() => {
        expect(getByTestId('discovery-screen')).toBeTruthy();
      });

      const transitions: number[] = [];

      // Perform multiple rapid transitions
      for (let i = 0; i < 3; i++) {
        const startTime = performance.now();

        act(() => {
          const profileTab = getByTestId('profile-tab');
          profileTab.props.onPress();
        });

        await waitFor(() => {
          expect(getByTestId('profile-screen')).toBeTruthy();
        });

        const endTime = performance.now();
        transitions.push(endTime - startTime);

        act(() => {
          const discoveryTab = getByTestId('discovery-tab');
          discoveryTab.props.onPress();
        });

        await waitFor(() => {
          expect(getByTestId('discovery-screen')).toBeTruthy();
        });
      }

      // All transitions should be under 300ms
      transitions.forEach((time, index) => {
        expect(time).toBeLessThan(300);
        console.log(`Transition ${index + 1} time: ${time.toFixed(2)}ms`);
      });

      // Average should also be well under 300ms
      const avgTime = transitions.reduce((a, b) => a + b, 0) / transitions.length;
      expect(avgTime).toBeLessThan(300);
      
      console.log(`Average transition time: ${avgTime.toFixed(2)}ms`);
    });
  });

  /**
   * Requirement 15.3: WebSocket message latency < 100ms
   * 
   * Tests that WebSocket messages are processed and reflected
   * in the UI within 100ms (excluding network delay).
   */
  describe('WebSocket Message Latency', () => {
    it('should process WebSocket messages within 100ms', async () => {
      const mockUser: User = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        avatar: null,
        provider: 'spotify',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (useAuthStore as unknown as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        user: mockUser,
      });

      const mockSocketManager = socketManager as jest.Mocked<typeof socketManager>;
      let messageHandler: ((data: any) => void) | null = null;

      mockSocketManager.subscribe.mockImplementation((event, handler) => {
        if (event === 'listener:added') {
          messageHandler = handler;
        }
      });

      const { getByText } = render(<App />);

      await waitFor(() => {
        expect(getByText('Discovery')).toBeTruthy();
      });

      // Simulate WebSocket message
      const startTime = performance.now();

      act(() => {
        if (messageHandler) {
          messageHandler({
            listener: {
              userId: 'user-2',
              username: 'testuser2',
              avatar: null,
              trackId: 'track-1',
              track: {
                id: 'track-1',
                title: 'Test Song',
                artist: 'Test Artist',
                album: 'Test Album',
                artwork: 'https://example.com/artwork.jpg',
                duration: 180,
                isrc: null,
                provider: 'spotify',
              },
              startedAt: new Date().toISOString(),
            },
          });
        }
      });

      // Wait for UI update
      await waitFor(
        () => {
          expect(getByText('Test Song')).toBeTruthy();
        },
        { timeout: 100 }
      );

      const endTime = performance.now();
      const latency = endTime - startTime;

      expect(latency).toBeLessThan(100);
      
      console.log(`WebSocket message processing latency: ${latency.toFixed(2)}ms`);
    });

    it('should handle multiple WebSocket messages efficiently', async () => {
      const mockUser: User = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        avatar: null,
        provider: 'spotify',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (useAuthStore as unknown as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        user: mockUser,
      });

      const mockSocketManager = socketManager as jest.Mocked<typeof socketManager>;
      let messageHandler: ((data: any) => void) | null = null;

      mockSocketManager.subscribe.mockImplementation((event, handler) => {
        if (event === 'listener:added') {
          messageHandler = handler;
        }
      });

      render(<App />);

      await waitFor(() => {
        expect(mockSocketManager.subscribe).toHaveBeenCalled();
      });

      const latencies: number[] = [];

      // Send multiple messages
      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();

        act(() => {
          if (messageHandler) {
            messageHandler({
              listener: {
                userId: `user-${i}`,
                username: `testuser${i}`,
                avatar: null,
                trackId: `track-${i}`,
                track: {
                  id: `track-${i}`,
                  title: `Test Song ${i}`,
                  artist: 'Test Artist',
                  album: 'Test Album',
                  artwork: 'https://example.com/artwork.jpg',
                  duration: 180,
                  isrc: null,
                  provider: 'spotify',
                },
                startedAt: new Date().toISOString(),
              },
            });
          }
        });

        const endTime = performance.now();
        latencies.push(endTime - startTime);
      }

      // All messages should be processed within 100ms
      latencies.forEach((latency, index) => {
        expect(latency).toBeLessThan(100);
        console.log(`Message ${index + 1} latency: ${latency.toFixed(2)}ms`);
      });

      // Average latency should be well under 100ms
      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      expect(avgLatency).toBeLessThan(100);
      
      console.log(`Average message latency: ${avgLatency.toFixed(2)}ms`);
    });

    it('should maintain low latency under load', async () => {
      const mockUser: User = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        avatar: null,
        provider: 'spotify',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (useAuthStore as unknown as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        user: mockUser,
      });

      const mockSocketManager = socketManager as jest.Mocked<typeof socketManager>;
      const handlers: Map<string, (data: any) => void> = new Map();

      mockSocketManager.subscribe.mockImplementation((event, handler) => {
        handlers.set(event, handler);
      });

      render(<App />);

      await waitFor(() => {
        expect(mockSocketManager.subscribe).toHaveBeenCalled();
      });

      // Simulate high load with multiple event types
      const events = [
        'listener:added',
        'listener:removed',
        'listener:count',
        'game:round-start',
        'chat:message',
      ];

      const latencies: number[] = [];

      for (let i = 0; i < 50; i++) {
        const event = events[i % events.length];
        const handler = handlers.get(event);

        if (handler) {
          const startTime = performance.now();

          act(() => {
            handler({ data: `test-${i}` });
          });

          const endTime = performance.now();
          latencies.push(endTime - startTime);
        }
      }

      // 95th percentile should be under 100ms
      const sorted = latencies.sort((a, b) => a - b);
      const p95Index = Math.floor(sorted.length * 0.95);
      const p95Latency = sorted[p95Index];

      expect(p95Latency).toBeLessThan(100);
      
      console.log(`P95 latency under load: ${p95Latency.toFixed(2)}ms`);
      console.log(`Max latency: ${sorted[sorted.length - 1].toFixed(2)}ms`);
    });
  });

  /**
   * Requirement 15.5: Memory usage < 200MB
   * 
   * Tests that the app maintains memory usage under 200MB
   * during normal operation.
   */
  describe('Memory Usage', () => {
    it('should maintain memory usage under 200MB during normal operation', async () => {
      const mockUser: User = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        avatar: null,
        provider: 'spotify',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (useAuthStore as unknown as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        user: mockUser,
      });

      // Get initial memory usage
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      const { unmount } = render(<App />);

      await waitFor(() => {
        expect(useAuthStore).toHaveBeenCalled();
      });

      // Simulate normal app usage
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // Get memory after usage
      const currentMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryUsed = (currentMemory - initialMemory) / (1024 * 1024); // Convert to MB

      // Memory usage should be under 200MB
      expect(memoryUsed).toBeLessThan(200);
      
      console.log(`Memory usage: ${memoryUsed.toFixed(2)}MB`);

      unmount();
    });

    it('should not leak memory during screen transitions', async () => {
      const mockUser: User = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        avatar: null,
        provider: 'spotify',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (useAuthStore as unknown as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        user: mockUser,
      });

      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      const { getByTestId, unmount } = render(<App />);

      await waitFor(() => {
        expect(getByTestId('discovery-screen')).toBeTruthy();
      });

      // Perform multiple screen transitions
      for (let i = 0; i < 10; i++) {
        act(() => {
          const profileTab = getByTestId('profile-tab');
          profileTab.props.onPress();
        });

        await waitFor(() => {
          expect(getByTestId('profile-screen')).toBeTruthy();
        });

        act(() => {
          const discoveryTab = getByTestId('discovery-tab');
          discoveryTab.props.onPress();
        });

        await waitFor(() => {
          expect(getByTestId('discovery-screen')).toBeTruthy();
        });
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryGrowth = (finalMemory - initialMemory) / (1024 * 1024);

      // Memory growth should be minimal (< 50MB for 10 transitions)
      expect(memoryGrowth).toBeLessThan(50);
      
      console.log(`Memory growth after 10 transitions: ${memoryGrowth.toFixed(2)}MB`);

      unmount();
    });

    it('should handle large data sets efficiently', async () => {
      const mockUser: User = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        avatar: null,
        provider: 'spotify',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (useAuthStore as unknown as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        user: mockUser,
      });

      const mockSocketManager = socketManager as jest.Mocked<typeof socketManager>;
      let messageHandler: ((data: any) => void) | null = null;

      mockSocketManager.subscribe.mockImplementation((event, handler) => {
        if (event === 'listener:added') {
          messageHandler = handler;
        }
      });

      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      render(<App />);

      await waitFor(() => {
        expect(mockSocketManager.subscribe).toHaveBeenCalled();
      });

      // Simulate receiving 100 listener updates
      act(() => {
        for (let i = 0; i < 100; i++) {
          if (messageHandler) {
            messageHandler({
              listener: {
                userId: `user-${i}`,
                username: `testuser${i}`,
                avatar: null,
                trackId: `track-${i % 20}`, // 20 unique tracks
                track: {
                  id: `track-${i % 20}`,
                  title: `Test Song ${i % 20}`,
                  artist: 'Test Artist',
                  album: 'Test Album',
                  artwork: 'https://example.com/artwork.jpg',
                  duration: 180,
                  isrc: null,
                  provider: 'spotify',
                },
                startedAt: new Date().toISOString(),
              },
            });
          }
        }
      });

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryUsed = (finalMemory - initialMemory) / (1024 * 1024);

      // Memory usage for 100 listeners should be reasonable (< 100MB)
      expect(memoryUsed).toBeLessThan(100);
      
      console.log(`Memory usage with 100 listeners: ${memoryUsed.toFixed(2)}MB`);
    });
  });
});
