import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { colors, typography } from '../tokens';

export interface TextProps extends RNTextProps {
  /**
   * Typography variant
   */
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'bodySmall' | 'caption' | 'label';
  /**
   * Text color variant
   */
  color?: 'primary' | 'secondary' | 'tertiary' | 'disabled' | 'accent' | 'error' | 'success';
  /**
   * Font weight
   */
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  /**
   * Text alignment
   */
  align?: 'left' | 'center' | 'right';
  /**
   * Text content
   */
  children: React.ReactNode;
}

export function Text({
  variant = 'body',
  color = 'primary',
  weight,
  align = 'left',
  style,
  children,
  ...props
}: TextProps) {
  const variantStyle = getVariantStyle(variant);
  const colorStyle = getColorStyle(color);
  const weightStyle = weight ? { fontFamily: typography.fontFamily[weight] } : {};
  const alignStyle = { textAlign: align };

  return (
    <RNText
      style={[styles.base, variantStyle, colorStyle, weightStyle, alignStyle, style]}
      {...props}
    >
      {children}
    </RNText>
  );
}

function getVariantStyle(variant: TextProps['variant']) {
  const variantMap = {
    h1: {
      fontSize: typography.fontSize['4xl'],
      lineHeight: typography.fontSize['4xl'] * typography.lineHeight.tight,
      fontFamily: typography.fontFamily.bold,
      letterSpacing: typography.letterSpacing.tight,
    },
    h2: {
      fontSize: typography.fontSize['3xl'],
      lineHeight: typography.fontSize['3xl'] * typography.lineHeight.tight,
      fontFamily: typography.fontFamily.bold,
      letterSpacing: typography.letterSpacing.tight,
    },
    h3: {
      fontSize: typography.fontSize['2xl'],
      lineHeight: typography.fontSize['2xl'] * typography.lineHeight.tight,
      fontFamily: typography.fontFamily.semibold,
    },
    h4: {
      fontSize: typography.fontSize.xl,
      lineHeight: typography.fontSize.xl * typography.lineHeight.normal,
      fontFamily: typography.fontFamily.semibold,
    },
    body: {
      fontSize: typography.fontSize.base,
      lineHeight: typography.fontSize.base * typography.lineHeight.normal,
      fontFamily: typography.fontFamily.regular,
    },
    bodySmall: {
      fontSize: typography.fontSize.sm,
      lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
      fontFamily: typography.fontFamily.regular,
    },
    caption: {
      fontSize: typography.fontSize.xs,
      lineHeight: typography.fontSize.xs * typography.lineHeight.normal,
      fontFamily: typography.fontFamily.regular,
    },
    label: {
      fontSize: typography.fontSize.sm,
      lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
      fontFamily: typography.fontFamily.medium,
      letterSpacing: typography.letterSpacing.wide,
      textTransform: 'uppercase',
    },
  };

  return variantMap[variant!];
}

function getColorStyle(color: TextProps['color']) {
  const colorMap = {
    primary: { color: colors.text.primary },
    secondary: { color: colors.text.secondary },
    tertiary: { color: colors.text.tertiary },
    disabled: { color: colors.text.disabled },
    accent: { color: colors.accent.cyan },
    error: { color: colors.status.error },
    success: { color: colors.status.success },
  };

  return colorMap[color!];
}

const styles = StyleSheet.create({
  base: {
    color: colors.text.primary,
  },
});
