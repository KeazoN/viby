import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, colors, spacing } from '@viby/shared/design-system';
import { useNetworkState } from '../hooks/use-network-monitor';

export interface NetworkStatusIndicatorProps {
  /**
   * Custom message to display when offline
   */
  offlineMessage?: string;
  /**
   * Custom message to display when no internet
   */
  noInternetMessage?: string;
  /**
   * Whether to show the indicator
   * If not provided, will show based on network state
   */
  visible?: boolean;
}

/**
 * NetworkStatusIndicator
 * 
 * Displays a banner at the top of the screen when the device is offline
 * or has no internet connection.
 * 
 * 
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <View>
 *       <NetworkStatusIndicator />
 *       <YourContent />
 *     </View>
 *   );
 * }
 * ```
 */
export function NetworkStatusIndicator({
  offlineMessage = 'No connection',
  noInternetMessage = 'No internet access',
  visible,
}: NetworkStatusIndicatorProps) {
  const { isConnected, isInternetReachable } = useNetworkState();

  // Determine if we should show the indicator
  const shouldShow =
    visible !== undefined
      ? visible
      : !isConnected || isInternetReachable === false;

  if (!shouldShow) {
    return null;
  }

  // Determine the message to display
  const message = !isConnected ? offlineMessage : noInternetMessage;

  return (
    <View
      style={styles.container}
      accessibilityRole="alert"
      accessibilityLabel={message}
      accessibilityLiveRegion="polite"
    >
      <View style={styles.content}>
        <View style={styles.indicator} />
        <Text variant="bodySmall" weight="medium" style={styles.text}>
          {message}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.status.warning,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.background.primary,
    marginRight: spacing[2],
  },
  text: {
    color: colors.background.primary,
  },
});
