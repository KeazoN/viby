/**
 * Accessibility Utilities
 * 
 * Provides helper functions and constants for implementing WCAG AA accessibility standards
 */

import { AccessibilityInfo, Platform } from 'react-native';

/**
 * Minimum touch target size in points (WCAG AA standard)
 */
export const MIN_TOUCH_TARGET_SIZE = 44;

/**
 * WCAG AA contrast ratio requirements
 */
export const CONTRAST_RATIOS = {
  NORMAL_TEXT: 4.5,
  LARGE_TEXT: 3.0,
  UI_COMPONENTS: 3.0,
} as const;

/**
 * Check if reduce motion is enabled on the device
 */
export async function isReduceMotionEnabled(): Promise<boolean> {
  try {
    return await AccessibilityInfo.isReduceMotionEnabled();
  } catch (error) {
    console.warn('Failed to check reduce motion setting:', error);
    return false;
  }
}

/**
 * Check if screen reader is enabled
 */
export async function isScreenReaderEnabled(): Promise<boolean> {
  try {
    return await AccessibilityInfo.isScreenReaderEnabled();
  } catch (error) {
    console.warn('Failed to check screen reader setting:', error);
    return false;
  }
}

/**
 * Announce a message to screen readers
 */
export function announceForAccessibility(message: string): void {
  AccessibilityInfo.announceForAccessibility(message);
}

/**
 * Set accessibility focus to a specific element
 * @param reactTag - The react tag of the element to focus
 */
export function setAccessibilityFocus(reactTag: number): void {
  AccessibilityInfo.setAccessibilityFocus(reactTag);
}

/**
 * Generate accessibility hint for interactive elements
 */
export function generateAccessibilityHint(action: string, context?: string): string {
  const baseHint = `Double tap to ${action}`;
  return context ? `${baseHint}. ${context}` : baseHint;
}

/**
 * Get platform-specific screen reader name
 */
export function getScreenReaderName(): string {
  return Platform.select({
    ios: 'VoiceOver',
    android: 'TalkBack',
    default: 'screen reader',
  });
}

/**
 * Format count for accessibility (e.g., "1 listener" vs "5 listeners")
 */
export function formatCountForAccessibility(count: number, singular: string, plural?: string): string {
  const pluralForm = plural || `${singular}s`;
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

/**
 * Create accessible label for time-based content
 */
export function formatTimeForAccessibility(timestamp: string | Date): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
}

/**
 * Create accessible label for music track
 */
export function formatTrackForAccessibility(title: string, artist: string): string {
  return `${title} by ${artist}`;
}

/**
 * Create accessible label for game score
 */
export function formatScoreForAccessibility(score: number, maxScore?: number): string {
  if (maxScore !== undefined) {
    return `${score} out of ${maxScore} points`;
  }
  return `${score} ${score === 1 ? 'point' : 'points'}`;
}

/**
 * Accessibility roles for common UI patterns
 */
export const AccessibilityRoles = {
  BUTTON: 'button',
  LINK: 'link',
  SEARCH: 'search',
  IMAGE: 'image',
  TEXT: 'text',
  HEADER: 'header',
  SUMMARY: 'summary',
  ADJUSTABLE: 'adjustable',
  IMAGE_BUTTON: 'imagebutton',
  KEYBOARD_KEY: 'keyboardkey',
  MENU: 'menu',
  MENU_BAR: 'menubar',
  MENU_ITEM: 'menuitem',
  NONE: 'none',
  PROGRESS_BAR: 'progressbar',
  RADIO: 'radio',
  RADIO_GROUP: 'radiogroup',
  SCROLLBAR: 'scrollbar',
  SPINBUTTON: 'spinbutton',
  SWITCH: 'switch',
  TAB: 'tab',
  TAB_LIST: 'tablist',
  TIMER: 'timer',
  TOOLBAR: 'toolbar',
} as const;

/**
 * Accessibility traits for iOS
 */
export const AccessibilityTraits = {
  BUTTON: 'button',
  LINK: 'link',
  HEADER: 'header',
  SEARCH: 'search',
  IMAGE: 'image',
  SELECTED: 'selected',
  PLAYS_SOUND: 'playsSound',
  KEY: 'key',
  TEXT: 'text',
  SUMMARY: 'summary',
  DISABLED: 'disabled',
  FREQUENTLY_UPDATES: 'frequentUpdates',
  STARTS_MEDIA: 'startsMedia',
  ADJUSTABLE: 'adjustable',
  ALLOWS_DIRECT_INTERACTION: 'allowsDirectInteraction',
  CAUSES_PAGE_TURN: 'pageTurn',
} as const;
