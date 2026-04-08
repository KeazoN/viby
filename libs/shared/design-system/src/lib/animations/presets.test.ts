/**
 * Tests for animation presets
 * Validates animation configurations and preset functions
 */

import {
  springConfigs,
  timingConfigs,
  animationPresets,
  getStaggerDelay,
} from './presets';

describe('Animation Presets', () => {
  describe('springConfigs', () => {
    it('should have all required spring configurations', () => {
      expect(springConfigs).toHaveProperty('default');
      expect(springConfigs).toHaveProperty('gentle');
      expect(springConfigs).toHaveProperty('bouncy');
      expect(springConfigs).toHaveProperty('stiff');
      expect(springConfigs).toHaveProperty('slow');
    });

    it('should have valid spring config properties', () => {
      Object.values(springConfigs).forEach((config) => {
        expect(config).toHaveProperty('damping');
        expect(config).toHaveProperty('stiffness');
        expect(config).toHaveProperty('mass');
        expect(config.damping).toBeGreaterThan(0);
        expect(config.stiffness).toBeGreaterThan(0);
        expect(config.mass).toBeGreaterThan(0);
      });
    });

    it('should have bouncy config with lower damping than default', () => {
      expect(springConfigs.bouncy.damping).toBeLessThan(
        springConfigs.default.damping
      );
    });

    it('should have gentle config with higher damping than default', () => {
      expect(springConfigs.gentle.damping).toBeGreaterThan(
        springConfigs.default.damping
      );
    });

    it('should have stiff config with higher stiffness than default', () => {
      expect(springConfigs.stiff.stiffness).toBeGreaterThan(
        springConfigs.default.stiffness
      );
    });
  });

  describe('timingConfigs', () => {
    it('should have all required timing configurations', () => {
      expect(timingConfigs).toHaveProperty('fast');
      expect(timingConfigs).toHaveProperty('normal');
      expect(timingConfigs).toHaveProperty('slow');
      expect(timingConfigs).toHaveProperty('linear');
      expect(timingConfigs).toHaveProperty('easeIn');
      expect(timingConfigs).toHaveProperty('easeOut');
      expect(timingConfigs).toHaveProperty('easeInOut');
    });

    it('should have valid timing config properties', () => {
      Object.values(timingConfigs).forEach((config) => {
        expect(config).toHaveProperty('duration');
        expect(config).toHaveProperty('easing');
        expect(config.duration).toBeGreaterThan(0);
        expect(typeof config.easing).toBe('function');
      });
    });

    it('should have fast duration less than normal', () => {
      expect(timingConfigs.fast.duration).toBeLessThan(
        timingConfigs.normal.duration
      );
    });

    it('should have slow duration greater than normal', () => {
      expect(timingConfigs.slow.duration).toBeGreaterThan(
        timingConfigs.normal.duration
      );
    });

    it('should have expected duration values', () => {
      expect(timingConfigs.fast.duration).toBe(150);
      expect(timingConfigs.normal.duration).toBe(300);
      expect(timingConfigs.slow.duration).toBe(500);
    });
  });

  describe('animationPresets', () => {
    it('should have all required preset functions', () => {
      expect(animationPresets).toHaveProperty('fadeIn');
      expect(animationPresets).toHaveProperty('fadeOut');
      expect(animationPresets).toHaveProperty('slideInRight');
      expect(animationPresets).toHaveProperty('slideInLeft');
      expect(animationPresets).toHaveProperty('slideInTop');
      expect(animationPresets).toHaveProperty('slideInBottom');
      expect(animationPresets).toHaveProperty('pulse');
      expect(animationPresets).toHaveProperty('shake');
      expect(animationPresets).toHaveProperty('bounce');
      expect(animationPresets).toHaveProperty('rotate');
      expect(animationPresets).toHaveProperty('scaleIn');
      expect(animationPresets).toHaveProperty('scaleOut');
      expect(animationPresets).toHaveProperty('slideAndFadeIn');
      expect(animationPresets).toHaveProperty('slideAndFadeOut');
    });

    it('should have all preset functions be callable', () => {
      expect(typeof animationPresets.fadeIn).toBe('function');
      expect(typeof animationPresets.fadeOut).toBe('function');
      expect(typeof animationPresets.slideInRight).toBe('function');
      expect(typeof animationPresets.slideInLeft).toBe('function');
      expect(typeof animationPresets.slideInTop).toBe('function');
      expect(typeof animationPresets.slideInBottom).toBe('function');
      expect(typeof animationPresets.pulse).toBe('function');
      expect(typeof animationPresets.shake).toBe('function');
      expect(typeof animationPresets.bounce).toBe('function');
      expect(typeof animationPresets.rotate).toBe('function');
      expect(typeof animationPresets.scaleIn).toBe('function');
      expect(typeof animationPresets.scaleOut).toBe('function');
      expect(typeof animationPresets.slideAndFadeIn).toBe('function');
      expect(typeof animationPresets.slideAndFadeOut).toBe('function');
    });

    describe('fadeIn', () => {
      it('should return an animation object', () => {
        const animation = animationPresets.fadeIn();
        expect(animation).toBeDefined();
        expect(typeof animation).toBe('object');
      });

      it('should accept custom timing config', () => {
        const customConfig = { duration: 500, easing: (t: number) => t };
        const animation = animationPresets.fadeIn(customConfig);
        expect(animation).toBeDefined();
      });
    });

    describe('fadeOut', () => {
      it('should return an animation object', () => {
        const animation = animationPresets.fadeOut();
        expect(animation).toBeDefined();
        expect(typeof animation).toBe('object');
      });
    });

    describe('slideInRight', () => {
      it('should return an animation object', () => {
        const animation = animationPresets.slideInRight(375);
        expect(animation).toBeDefined();
        expect(typeof animation).toBe('object');
      });

      it('should accept custom spring config', () => {
        const animation = animationPresets.slideInRight(
          375,
          springConfigs.bouncy
        );
        expect(animation).toBeDefined();
      });
    });

    describe('slideInLeft', () => {
      it('should return an animation object', () => {
        const animation = animationPresets.slideInLeft(375);
        expect(animation).toBeDefined();
      });
    });

    describe('slideInTop', () => {
      it('should return an animation object', () => {
        const animation = animationPresets.slideInTop(812);
        expect(animation).toBeDefined();
      });
    });

    describe('slideInBottom', () => {
      it('should return an animation object', () => {
        const animation = animationPresets.slideInBottom(812);
        expect(animation).toBeDefined();
      });
    });

    describe('pulse', () => {
      it('should return an animation object', () => {
        const animation = animationPresets.pulse();
        expect(animation).toBeDefined();
      });

      it('should accept custom scale value', () => {
        const animation = animationPresets.pulse(1.2);
        expect(animation).toBeDefined();
      });

      it('should accept custom timing config', () => {
        const animation = animationPresets.pulse(1.1, timingConfigs.slow);
        expect(animation).toBeDefined();
      });
    });

    describe('shake', () => {
      it('should return an animation object', () => {
        const animation = animationPresets.shake();
        expect(animation).toBeDefined();
      });

      it('should accept custom distance value', () => {
        const animation = animationPresets.shake(15);
        expect(animation).toBeDefined();
      });

      it('should accept custom timing config', () => {
        const animation = animationPresets.shake(10, timingConfigs.fast);
        expect(animation).toBeDefined();
      });
    });

    describe('bounce', () => {
      it('should return an animation object', () => {
        const animation = animationPresets.bounce();
        expect(animation).toBeDefined();
      });

      it('should accept custom spring config', () => {
        const animation = animationPresets.bounce(springConfigs.stiff);
        expect(animation).toBeDefined();
      });
    });

    describe('rotate', () => {
      it('should return an animation object', () => {
        const animation = animationPresets.rotate();
        expect(animation).toBeDefined();
      });

      it('should accept custom duration', () => {
        const animation = animationPresets.rotate(2000);
        expect(animation).toBeDefined();
      });
    });

    describe('scaleIn', () => {
      it('should return an animation object', () => {
        const animation = animationPresets.scaleIn();
        expect(animation).toBeDefined();
      });
    });

    describe('scaleOut', () => {
      it('should return an animation object', () => {
        const animation = animationPresets.scaleOut();
        expect(animation).toBeDefined();
      });
    });

    describe('slideAndFadeIn', () => {
      it('should return an object with translateY and opacity', () => {
        const animation = animationPresets.slideAndFadeIn();
        expect(animation).toHaveProperty('translateY');
        expect(animation).toHaveProperty('opacity');
      });

      it('should accept custom distance', () => {
        const animation = animationPresets.slideAndFadeIn(30);
        expect(animation).toBeDefined();
      });

      it('should accept custom timing config', () => {
        const animation = animationPresets.slideAndFadeIn(
          20,
          timingConfigs.slow
        );
        expect(animation).toBeDefined();
      });
    });

    describe('slideAndFadeOut', () => {
      it('should return an object with translateY and opacity', () => {
        const animation = animationPresets.slideAndFadeOut();
        expect(animation).toHaveProperty('translateY');
        expect(animation).toHaveProperty('opacity');
      });
    });
  });

  describe('getStaggerDelay', () => {
    it('should return 0 for index 0', () => {
      expect(getStaggerDelay(0)).toBe(0);
    });

    it('should return correct delay for index 1 with default delay', () => {
      expect(getStaggerDelay(1)).toBe(50);
    });

    it('should return correct delay for index 2 with default delay', () => {
      expect(getStaggerDelay(2)).toBe(100);
    });

    it('should accept custom delay value', () => {
      expect(getStaggerDelay(1, 100)).toBe(100);
      expect(getStaggerDelay(2, 100)).toBe(200);
    });

    it('should calculate delay correctly for large indices', () => {
      expect(getStaggerDelay(10, 50)).toBe(500);
      expect(getStaggerDelay(20, 25)).toBe(500);
    });

    it('should handle zero delay', () => {
      expect(getStaggerDelay(5, 0)).toBe(0);
    });
  });

  describe('Configuration consistency', () => {
    it('should have consistent spring config structure', () => {
      const requiredProps = [
        'damping',
        'stiffness',
        'mass',
        'overshootClamping',
        'restDisplacementThreshold',
        'restSpeedThreshold',
      ];

      Object.values(springConfigs).forEach((config) => {
        requiredProps.forEach((prop) => {
          expect(config).toHaveProperty(prop);
        });
      });
    });

    it('should have consistent timing config structure', () => {
      const requiredProps = ['duration', 'easing'];

      Object.values(timingConfigs).forEach((config) => {
        requiredProps.forEach((prop) => {
          expect(config).toHaveProperty(prop);
        });
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle negative screen dimensions gracefully', () => {
      const animation = animationPresets.slideInRight(-100);
      expect(animation).toBeDefined();
    });

    it('should handle zero screen dimensions', () => {
      const animation = animationPresets.slideInBottom(0);
      expect(animation).toBeDefined();
    });

    it('should handle very large screen dimensions', () => {
      const animation = animationPresets.slideInTop(10000);
      expect(animation).toBeDefined();
    });

    it('should handle negative scale values', () => {
      const animation = animationPresets.pulse(-1);
      expect(animation).toBeDefined();
    });

    it('should handle zero scale values', () => {
      const animation = animationPresets.pulse(0);
      expect(animation).toBeDefined();
    });

    it('should handle negative shake distance', () => {
      const animation = animationPresets.shake(-10);
      expect(animation).toBeDefined();
    });

    it('should handle zero shake distance', () => {
      const animation = animationPresets.shake(0);
      expect(animation).toBeDefined();
    });

    it('should handle negative rotation duration', () => {
      const animation = animationPresets.rotate(-1000);
      expect(animation).toBeDefined();
    });

    it('should handle zero rotation duration', () => {
      const animation = animationPresets.rotate(0);
      expect(animation).toBeDefined();
    });
  });
});
