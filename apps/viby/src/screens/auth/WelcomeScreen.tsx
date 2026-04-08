import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../app/navigation/types';
import { Button, Text } from '@viby/shared/design-system';
import { colors, spacing } from '@viby/shared/design-system';

type WelcomeScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;

export function WelcomeScreen() {
  const navigation = useNavigation<WelcomeScreenNavigationProp>();

  const handleSpotifyLogin = () => {
    navigation.navigate('Login', { provider: 'spotify' });
  };

  const handleDeezerLogin = () => {
    navigation.navigate('Login', { provider: 'deezer' });
  };

  return (
    <View style={styles.container}>
      {/* Logo Section */}
      <View style={styles.logoSection}>
        <Text variant="h1" align="center" style={styles.logo}>
          Viby
        </Text>
      </View>

      {/* Tagline Section */}
      <View style={styles.taglineSection}>
        <Text variant="h4" color="secondary" align="center" style={styles.tagline}>
          See who's vibing to the same music, connect instantly, play together
        </Text>
      </View>

      {/* Login Buttons Section */}
      <View style={styles.buttonSection}>
        <Button
          variant="primary"
          size="lg"
          onPress={handleSpotifyLogin}
          fullWidth
          accessibilityLabel="Login with Spotify"
        >
          Login with Spotify
        </Button>

        <View style={styles.deezerButton}>
          <Button
            variant="primary"
            size="lg"
            onPress={handleDeezerLogin}
            fullWidth
            accessibilityLabel="Login with Deezer"
          >
            Login with Deezer
          </Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    paddingHorizontal: spacing[6],
  },
  logoSection: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    // Placeholder for logo - can be replaced with Image component later
    marginBottom: spacing[4],
  },
  taglineSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
  },
  tagline: {
    textAlign: 'center',
  },
  buttonSection: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: spacing[8],
  },
  deezerButton: {
    marginTop: spacing[4],
  },
});
