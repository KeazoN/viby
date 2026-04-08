import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../tokens';

export interface CardProps {
  /**
   * Card content
   */
  children: React.ReactNode;
  /**
   * Card variant
   */
  variant?: 'default' | 'elevated' | 'glow';
  /**
   * Glow color (only for glow variant)
   */
  glowColor?: 'cyan' | 'magenta';
  /**
   * Press handler (makes card touchable)
   */
  onPress?: () => void;
  /**
   * Custom padding
   */
  padding?: keyof typeof spacing;
  /**
   * Additional styles
   */
  style?: ViewStyle;
  /**
   * Accessibility label
   */
  accessibilityLabel?: string;
}

export function Card({
  children,
  variant = 'default',
  glowColor = 'cyan',
  onPress,
  padding = 4,
  style,
  accessibilityLabel,
}: CardProps) {
  const Component = onPress ? TouchableOpacity : View;

  const variantStyle = getVariantStyle(variant, glowColor);
  const paddingStyle = { padding: spacing[padding] };

  return (
    <Component
      onPress={onPress}
      style={[styles.card, paddingStyle, variantStyle, style]}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {children}
    </Component>
  );
}

function getVariantStyle(variant: CardProps['variant'], glowColor: CardProps['glowColor']) {
  const variantMap = {
    default: {},
    elevated: shadows.lg,
    glow: shadows.glow[glowColor!],
  };

  return variantMap[variant!];
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
  },
});
