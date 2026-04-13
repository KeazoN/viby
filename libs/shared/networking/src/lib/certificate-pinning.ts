/**
 * Certificate Pinning Configuration
 * 
 * This module provides certificate pinning configuration for API requests.
 * 
 * IMPORTANT: Full SSL certificate pinning in React Native/Expo requires:
 * 1. A custom development client (expo-dev-client)
 * 2. Native modules like react-native-ssl-pinning or expo-ssl-pinning
 * 3. Certificate hashes extracted from your backend SSL certificate
 * 
 * For production deployment:
 * - Extract certificate hashes using: openssl s_client -connect api.viby.app:443 | openssl x509 -pubkey -noout | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | openssl enc -base64
 * - Add the hashes to CERTIFICATE_PINS below
 * - Install react-native-ssl-pinning or similar package
 * - Configure native builds to use SSL pinning
 * 
 * @see https://docs.expo.dev/guides/using-custom-native-code/
 */

/**
 * Certificate pins for API endpoints
 * Key: hostname
 * Value: array of SHA-256 certificate hashes in base64 format
 */
export const CERTIFICATE_PINS: Record<string, string[]> = {
  // Production API
  'api.viby.app': [
    // Primary certificate hash - REPLACE WITH ACTUAL HASH
    'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
    // Backup certificate hash (for certificate rotation)
    'sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=',
  ],
  
  // Staging API
  'api-staging.viby.app': [
    'sha256/CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC=',
  ],
  
  // Development - typically no pinning for localhost
  // 'localhost': [],
};

/**
 * Get certificate pins for a given hostname
 */
export function getCertificatePins(hostname: string): string[] | undefined {
  return CERTIFICATE_PINS[hostname];
}

/**
 * Check if certificate pinning is configured for a hostname
 */
export function hasCertificatePins(hostname: string): boolean {
  const pins = CERTIFICATE_PINS[hostname];
  return pins !== undefined && pins.length > 0;
}

/**
 * Validate that certificate pins are properly configured
 * This helps catch configuration errors during development
 */
export function validateCertificatePins(): void {
  const placeholderPattern = /^sha256\/[A-Z]+=$/;
  
  Object.entries(CERTIFICATE_PINS).forEach(([hostname, pins]) => {
    pins.forEach((pin, index) => {
      // Check for placeholder values
      if (placeholderPattern.test(pin)) {
        console.warn(
          `[Certificate Pinning] Placeholder certificate hash detected for ${hostname}[${index}]. ` +
          'Replace with actual certificate hash before production deployment.'
        );
      }
      
      // Check format
      if (!pin.startsWith('sha256/')) {
        console.error(
          `[Certificate Pinning] Invalid certificate hash format for ${hostname}[${index}]. ` +
          'Expected format: sha256/BASE64_HASH'
        );
      }
    });
  });
}

/**
 * Extract hostname from URL
 */
export function extractHostname(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (error) {
    console.error('[Certificate Pinning] Invalid URL:', url);
    throw new Error(`Invalid URL: ${url}`);
  }
}

/**
 * Certificate pinning configuration for HTTP client
 */
export interface CertificatePinningConfig {
  /**
   * Enable certificate pinning
   * Set to false in development to allow self-signed certificates
   */
  enabled: boolean;
  
  /**
   * Fail requests if no pins are configured for the hostname
   * Recommended: true for production, false for development
   */
  strictMode: boolean;
  
  /**
   * Custom certificate pins (overrides default CERTIFICATE_PINS)
   */
  customPins?: Record<string, string[]>;
}

/**
 * Default certificate pinning configuration
 */
export const DEFAULT_CERT_PINNING_CONFIG: CertificatePinningConfig = {
  enabled: process.env.EXPO_PUBLIC_ENV === 'production',
  strictMode: process.env.EXPO_PUBLIC_ENV === 'production',
  customPins: undefined,
};

/**
 * Get effective certificate pins (custom or default)
 */
export function getEffectivePins(
  config: CertificatePinningConfig
): Record<string, string[]> {
  return config.customPins || CERTIFICATE_PINS;
}
