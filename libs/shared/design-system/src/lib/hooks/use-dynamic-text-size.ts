/**
 * useDynamicTextSize Hook
 * 
 * Provides support for dynamic text sizing based on user's system font size preferences
 */

import { useState, useEffect } from 'react';
import { PixelRatio } from 'react-native';

/**
 * Font scale multiplier based on system settings
 */
export function useDynamicTextSize(): number {
  const [fontScale, setFontScale] = useState(PixelRatio.getFontScale());

  useEffect(() => {
    // Update font scale when it changes
    // Note: React Native doesn't provide a direct listener for font scale changes,
    // but it updates automatically when the app comes to foreground
    const updateFontScale = () => {
      setFontScale(PixelRatio.getFontScale());
    };

    // Update on mount
    updateFontScale();

    // In a real app, you might want to listen to AppState changes
    // and update the font scale when the app comes to foreground
  }, []);

  return fontScale;
}

/**
 * Calculate scaled font size based on system font scale
 */
export function useScaledFontSize(baseFontSize: number): number {
  const fontScale = useDynamicTextSize();
  return baseFontSize * fontScale;
}

/**
 * Get maximum font scale to prevent text from becoming too large
 */
export function getMaxFontScale(fontScale: number, maxScale: number = 2.0): number {
  return Math.min(fontScale, maxScale);
}

/**
 * Calculate scaled font size with maximum limit
 */
export function useScaledFontSizeWithMax(
  baseFontSize: number,
  maxScale: number = 2.0
): number {
  const fontScale = useDynamicTextSize();
  const limitedScale = getMaxFontScale(fontScale, maxScale);
  return baseFontSize * limitedScale;
}
