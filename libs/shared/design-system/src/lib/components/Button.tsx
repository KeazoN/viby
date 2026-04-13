import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, borderRadius } from '../tokens';

export interface ButtonProps {
  /**
   * Button variant
   */
  variant?: 'primary' | 'secondary' | 'ghost';
  /**
   * Button size
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Button content
   */
  children: React.ReactNode;
  /**
   * Press handler
   */
  onPress: () => void;
  /**
   * Disabled state
   */
  disabled?: boolean;
  /**
   * Loading state
   */
  loading?: boolean;
  /**
   * Full width button
   */
  fullWidth?: boolean;
  /**
   * Accessibility label
   */
  accessibilityLabel?: string;
  /**
   * Accessibility hint (describes what will happen when the button is pressed)
   */
  accessibilityHint?: string;
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  onPress,
  disabled = false,
  loading = false,
  fullWidth = false,
  accessibilityLabel,
  accessibilityHint,
}: ButtonProps) {
  const sizeStyles = getSizeStyles(size);
  const isDisabled = disabled || loading;

  const buttonContent = (
    <>
      {loading ? (
        <ActivityIndicator
          color={variant === 'ghost' ? colors.accent.cyan : colors.text.primary}
          size="small"
          accessibilityLabel="Loading"
        />
      ) : (
        <Text
          style={[
            styles.text,
            sizeStyles.text,
            variant === 'ghost' && styles.ghostText,
            isDisabled && styles.disabledText,
          ]}
          allowFontScaling={true}
          maxFontSizeMultiplier={1.5}
        >
          {children}
        </Text>
      )}
    </>
  );

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        style={[styles.container, fullWidth && styles.fullWidth]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || (typeof children === 'string' ? children : undefined)}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: isDisabled, busy: loading }}
      >
        <LinearGradient
          colors={isDisabled ? [colors.background.tertiary, colors.background.tertiary] : colors.gradient.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.gradient, sizeStyles.container]}
        >
          {buttonContent}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (variant === 'secondary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        style={[
          styles.container,
          styles.secondary,
          sizeStyles.container,
          fullWidth && styles.fullWidth,
          isDisabled && styles.disabledSecondary,
        ]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || (typeof children === 'string' ? children : undefined)}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: isDisabled, busy: loading }}
      >
        {buttonContent}
      </TouchableOpacity>
    );
  }

  // Ghost variant
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.container,
        styles.ghost,
        sizeStyles.container,
        fullWidth && styles.fullWidth,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || (typeof children === 'string' ? children : undefined)}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {buttonContent}
    </TouchableOpacity>
  );
}

function getSizeStyles(size: 'sm' | 'md' | 'lg') {
  const sizeMap = {
    sm: {
      container: {
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[2],
      } as ViewStyle,
      text: {
        fontSize: typography.fontSize.sm,
      } as TextStyle,
    },
    md: {
      container: {
        paddingHorizontal: spacing[6],
        paddingVertical: spacing[3],
      } as ViewStyle,
      text: {
        fontSize: typography.fontSize.base,
      } as TextStyle,
    },
    lg: {
      container: {
        paddingHorizontal: spacing[8],
        paddingVertical: spacing[4],
      } as ViewStyle,
      text: {
        fontSize: typography.fontSize.lg,
      } as TextStyle,
    },
  };

  return sizeMap[size];
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
  },
  fullWidth: {
    width: '100%',
    alignSelf: 'stretch',
  },
  gradient: {
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondary: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.accent.cyan,
  },
  disabledSecondary: {
    borderColor: colors.text.disabled,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: colors.text.primary,
    fontFamily: typography.fontFamily.semibold,
    textAlign: 'center',
  },
  ghostText: {
    color: colors.accent.cyan,
  },
  disabledText: {
    color: colors.text.disabled,
  },
});
