/**
 * Animation and transition tokens for the Viby design system
 * Duration and easing values for consistent animations
 */

export const animations = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },

  easing: {
    linear: 'linear',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },

  spring: {
    default: {
      damping: 15,
      stiffness: 150,
    },
    gentle: {
      damping: 20,
      stiffness: 100,
    },
    bouncy: {
      damping: 10,
      stiffness: 200,
    },
  },
} as const;
