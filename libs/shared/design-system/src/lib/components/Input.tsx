import React, { useState } from 'react';
import {
  TextInput,
  View,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../tokens';
import { Text } from './Text';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  /**
   * Input label
   */
  label?: string;
  /**
   * Error message
   */
  error?: string;
  /**
   * Helper text
   */
  helperText?: string;
  /**
   * Validation state
   */
  state?: 'default' | 'error' | 'success';
  /**
   * Full width input
   */
  fullWidth?: boolean;
  /**
   * Container style
   */
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  error,
  helperText,
  state = 'default',
  fullWidth = false,
  containerStyle,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  // Determine the actual state based on error prop
  const actualState = error ? 'error' : state;

  const borderColor = getBorderColor(actualState, isFocused);

  return (
    <View style={[styles.container, fullWidth && styles.fullWidth, containerStyle]}>
      {label && (
        <Text
          variant="label"
          color="secondary"
          style={styles.label}
          accessibilityRole="text"
        >
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputContainer,
          { borderColor },
          isFocused && styles.inputContainerFocused,
        ]}
      >
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.text.tertiary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          accessibilityLabel={label}
          accessibilityState={{
            disabled: props.editable === false,
          }}
          {...props}
        />
      </View>
      {(error || helperText) && (
        <Text
          variant="caption"
          color={error ? 'error' : 'secondary'}
          style={styles.helperText}
          accessibilityRole="text"
          accessibilityLiveRegion={error ? 'polite' : 'none'}
        >
          {error || helperText}
        </Text>
      )}
    </View>
  );
}

function getBorderColor(state: 'default' | 'error' | 'success', isFocused: boolean): string {
  if (isFocused) {
    return colors.accent.cyan;
  }

  const stateColorMap = {
    default: colors.background.tertiary,
    error: colors.status.error,
    success: colors.status.success,
  };

  return stateColorMap[state];
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
  },
  fullWidth: {
    width: '100%',
    alignSelf: 'stretch',
  },
  label: {
    marginBottom: spacing[2],
  },
  inputContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.background.tertiary,
  },
  inputContainerFocused: {
    borderWidth: 2,
  },
  input: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.primary,
    minHeight: 44, // Minimum touch target size for accessibility
  },
  helperText: {
    marginTop: spacing[1],
    marginLeft: spacing[1],
  },
});
