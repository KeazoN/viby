/**
 * Color tokens for the Viby design system
 * Dark theme with neon/gradient accents
 */

export const colors = {
  // Base colors
  background: {
    primary: '#0A0A0F',
    secondary: '#1A1A24',
    tertiary: '#2A2A34',
  },

  // Accent colors
  accent: {
    cyan: '#00F5FF',
    magenta: '#FF00E5',
    purple: '#9D4EDD',
    blue: '#4361EE',
  },

  // Gradients
  gradient: {
    primary: ['#00F5FF', '#9D4EDD'],
    secondary: ['#FF00E5', '#4361EE'],
    tertiary: ['#9D4EDD', '#FF00E5'],
  },

  // Text colors
  text: {
    primary: '#FFFFFF',
    secondary: '#B0B0B8',
    tertiary: '#808088',
    disabled: '#505058',
  },

  // Status colors
  status: {
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
  },

  // Overlay
  overlay: {
    light: 'rgba(255, 255, 255, 0.1)',
    medium: 'rgba(255, 255, 255, 0.2)',
    dark: 'rgba(0, 0, 0, 0.5)',
    darker: 'rgba(0, 0, 0, 0.8)',
  },
} as const;
