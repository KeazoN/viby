/**
 * Design tokens for the Viby design system
 * Centralized export of all design tokens
 */

import { colors } from './colors';
import { typography } from './typography';
import { spacing } from './spacing';
import { borderRadius } from './border-radius';
import { shadows } from './shadows';
import { animations } from './animations';

// Export individual token modules
export { colors, typography, spacing, borderRadius, shadows, animations };

// Re-export all tokens as a single object for convenience
export const tokens = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  animations,
} as const;
