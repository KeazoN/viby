/**
 * useAccessibility Hook
 * 
 * Provides accessibility state and utilities for components
 */

import { useState, useEffect } from 'react';
import { AccessibilityInfo } from 'react-native';
import { isReduceMotionEnabled, isScreenReaderEnabled } from '../utils/accessibility';

export interface AccessibilityState {
  isScreenReaderEnabled: boolean;
  isReduceMotionEnabled: boolean;
  isLoading: boolean;
}

/**
 * Hook to manage accessibility state
 */
export function useAccessibility(): AccessibilityState {
  const [state, setState] = useState<AccessibilityState>({
    isScreenReaderEnabled: false,
    isReduceMotionEnabled: false,
    isLoading: true,
  });

  useEffect(() => {
    let isMounted = true;

    // Initialize accessibility state
    const initializeAccessibility = async () => {
      try {
        const [screenReader, reduceMotion] = await Promise.all([
          isScreenReaderEnabled(),
          isReduceMotionEnabled(),
        ]);

        if (isMounted) {
          setState({
            isScreenReaderEnabled: screenReader,
            isReduceMotionEnabled: reduceMotion,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error('Failed to initialize accessibility state:', error);
        if (isMounted) {
          setState({
            isScreenReaderEnabled: false,
            isReduceMotionEnabled: false,
            isLoading: false,
          });
        }
      }
    };

    initializeAccessibility();

    // Listen for screen reader changes
    const screenReaderSubscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      (enabled) => {
        if (isMounted) {
          setState((prev) => ({ ...prev, isScreenReaderEnabled: enabled }));
        }
      }
    );

    // Listen for reduce motion changes
    const reduceMotionSubscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled) => {
        if (isMounted) {
          setState((prev) => ({ ...prev, isReduceMotionEnabled: enabled }));
        }
      }
    );

    return () => {
      isMounted = false;
      screenReaderSubscription.remove();
      reduceMotionSubscription.remove();
    };
  }, []);

  return state;
}

/**
 * Hook to check if screen reader is enabled
 */
export function useScreenReader(): boolean {
  const { isScreenReaderEnabled } = useAccessibility();
  return isScreenReaderEnabled;
}

/**
 * Hook to check if reduce motion is enabled
 */
export function useReduceMotion(): boolean {
  const { isReduceMotionEnabled } = useAccessibility();
  return isReduceMotionEnabled;
}
