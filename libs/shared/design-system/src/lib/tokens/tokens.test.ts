/**
 * Tests for design tokens
 * Verifies that all tokens are properly defined and exportable
 */

import { colors, typography, spacing, borderRadius, shadows, animations, tokens } from './index';

describe('Design Tokens', () => {
  describe('colors', () => {
    it('should export background colors', () => {
      expect(colors.background.primary).toBe('#0A0A0F');
      expect(colors.background.secondary).toBe('#1A1A24');
      expect(colors.background.tertiary).toBe('#2A2A34');
    });

    it('should export accent colors', () => {
      expect(colors.accent.cyan).toBe('#00F5FF');
      expect(colors.accent.magenta).toBe('#FF00E5');
      expect(colors.accent.purple).toBe('#9D4EDD');
      expect(colors.accent.blue).toBe('#4361EE');
    });

    it('should export gradient arrays', () => {
      expect(colors.gradient.primary).toEqual(['#00F5FF', '#9D4EDD']);
      expect(colors.gradient.secondary).toEqual(['#FF00E5', '#4361EE']);
    });

    it('should export text colors', () => {
      expect(colors.text.primary).toBe('#FFFFFF');
      expect(colors.text.secondary).toBe('#B0B0B8');
    });

    it('should export status colors', () => {
      expect(colors.status.success).toBe('#10B981');
      expect(colors.status.error).toBe('#EF4444');
    });
  });

  describe('typography', () => {
    it('should export font families', () => {
      expect(typography.fontFamily.regular).toBe('Inter-Regular');
      expect(typography.fontFamily.bold).toBe('Inter-Bold');
    });

    it('should export font sizes', () => {
      expect(typography.fontSize.xs).toBe(12);
      expect(typography.fontSize.base).toBe(16);
      expect(typography.fontSize['2xl']).toBe(24);
    });

    it('should export line heights', () => {
      expect(typography.lineHeight.tight).toBe(1.2);
      expect(typography.lineHeight.normal).toBe(1.5);
    });
  });

  describe('spacing', () => {
    it('should export spacing scale', () => {
      expect(spacing[0]).toBe(0);
      expect(spacing[1]).toBe(4);
      expect(spacing[4]).toBe(16);
      expect(spacing[8]).toBe(32);
    });
  });

  describe('borderRadius', () => {
    it('should export border radius values', () => {
      expect(borderRadius.none).toBe(0);
      expect(borderRadius.sm).toBe(4);
      expect(borderRadius.lg).toBe(16);
      expect(borderRadius.full).toBe(9999);
    });
  });

  describe('shadows', () => {
    it('should export shadow definitions', () => {
      expect(shadows.sm.elevation).toBe(1);
      expect(shadows.base.elevation).toBe(4);
      expect(shadows.lg.elevation).toBe(8);
    });

    it('should export glow shadows', () => {
      expect(shadows.glow.cyan.shadowColor).toBe('#00F5FF');
      expect(shadows.glow.magenta.shadowColor).toBe('#FF00E5');
    });
  });

  describe('animations', () => {
    it('should export duration values', () => {
      expect(animations.duration.fast).toBe(150);
      expect(animations.duration.normal).toBe(300);
      expect(animations.duration.slow).toBe(500);
    });

    it('should export spring configurations', () => {
      expect(animations.spring.default.damping).toBe(15);
      expect(animations.spring.bouncy.stiffness).toBe(200);
    });
  });

  describe('tokens object', () => {
    it('should export all tokens as a single object', () => {
      expect(tokens.colors).toBeDefined();
      expect(tokens.typography).toBeDefined();
      expect(tokens.spacing).toBeDefined();
      expect(tokens.borderRadius).toBeDefined();
      expect(tokens.shadows).toBeDefined();
      expect(tokens.animations).toBeDefined();
    });
  });
});
