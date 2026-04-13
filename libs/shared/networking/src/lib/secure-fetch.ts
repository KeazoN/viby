/**
 * Secure Fetch Wrapper with Certificate Pinning Support
 * 
 * This module provides a fetch wrapper that validates certificate pinning configuration.
 * 
 * NOTE: This is a validation layer. Actual SSL certificate pinning requires native modules.
 * For production apps, you must:
 * 1. Install react-native-ssl-pinning or expo-ssl-pinning
 * 2. Configure native builds with certificate hashes
 * 3. Use the native module's fetch implementation
 * 
 * This implementation provides:
 * - Configuration validation
 * - Development warnings
 * - Fallback to standard fetch with validation
 */

import {
  extractHostname,
  getCertificatePins,
  hasCertificatePins,
  validateCertificatePins,
  type CertificatePinningConfig,
  DEFAULT_CERT_PINNING_CONFIG,
  getEffectivePins,
} from './certificate-pinning';

/**
 * Secure fetch options extending standard RequestInit
 */
export interface SecureFetchOptions extends RequestInit {
  /**
   * Certificate pinning configuration
   */
  certificatePinning?: Partial<CertificatePinningConfig>;
}

/**
 * Certificate pinning error
 */
export class CertificatePinningError extends Error {
  constructor(
    message: string,
    public readonly hostname: string,
    public readonly url: string
  ) {
    super(message);
    this.name = 'CertificatePinningError';
  }
}

/**
 * Validate certificate pinning configuration before making request
 */
function validatePinningConfig(
  url: string,
  config: CertificatePinningConfig
): void {
  if (!config.enabled) {
    return;
  }

  const hostname = extractHostname(url);
  const pins = getEffectivePins(config);
  const hostPins = pins[hostname];

  // Check if pins are configured for this hostname
  if (!hostPins || hostPins.length === 0) {
    if (config.strictMode) {
      throw new CertificatePinningError(
        `No certificate pins configured for ${hostname}. ` +
        'Add certificate hashes to CERTIFICATE_PINS or disable strict mode.',
        hostname,
        url
      );
    } else {
      console.warn(
        `[Certificate Pinning] No pins configured for ${hostname}. ` +
        'Request will proceed without pinning validation.'
      );
    }
  }
}

/**
 * Secure fetch with certificate pinning validation
 * 
 * IMPORTANT: This function validates configuration but does not perform actual SSL pinning.
 * For production, replace with native SSL pinning implementation.
 * 
 * @param url - Request URL
 * @param options - Fetch options with certificate pinning config
 * @returns Promise<Response>
 * 
 * @example
 * ```typescript
 * const response = await secureFetch('https://api.viby.app/users', {
 *   method: 'GET',
 *   certificatePinning: {
 *     enabled: true,
 *     strictMode: true,
 *   },
 * });
 * ```
 */
export async function secureFetch(
  url: string,
  options: SecureFetchOptions = {}
): Promise<Response> {
  const { certificatePinning, ...fetchOptions } = options;
  
  // Merge with default config
  const config: CertificatePinningConfig = {
    ...DEFAULT_CERT_PINNING_CONFIG,
    ...certificatePinning,
  };

  // Validate configuration
  validatePinningConfig(url, config);

  // TODO: Replace with native SSL pinning implementation
  // For now, use standard fetch with validation
  // In production, this should use react-native-ssl-pinning or similar
  
  if (config.enabled && __DEV__) {
    console.info(
      '[Certificate Pinning] Using standard fetch. ' +
      'For production, implement native SSL pinning with react-native-ssl-pinning.'
    );
  }

  // Perform standard fetch
  // In production with native module, this would be:
  // return sslFetch(url, { ...fetchOptions, sslPinning: { certs: pins } });
  return fetch(url, fetchOptions);
}

/**
 * Initialize certificate pinning
 * Call this during app startup to validate configuration
 */
export function initializeCertificatePinning(): void {
  if (__DEV__) {
    console.log('[Certificate Pinning] Validating configuration...');
    validateCertificatePins();
    
    if (process.env.EXPO_PUBLIC_ENV === 'production') {
      console.warn(
        '[Certificate Pinning] Production mode detected. ' +
        'Ensure native SSL pinning is configured in your custom development client.'
      );
    }
  }
}

/**
 * Check if certificate pinning is available
 * Returns true if native SSL pinning module is available
 */
export function isCertificatePinningAvailable(): boolean {
  // TODO: Check if native module is available
  // For now, return false as we're using validation-only implementation
  return false;
}

/**
 * Get certificate pinning status for debugging
 */
export function getCertificatePinningStatus(): {
  available: boolean;
  enabled: boolean;
  strictMode: boolean;
  configuredHosts: string[];
} {
  const config = DEFAULT_CERT_PINNING_CONFIG;
  const pins = getEffectivePins(config);
  
  return {
    available: isCertificatePinningAvailable(),
    enabled: config.enabled,
    strictMode: config.strictMode,
    configuredHosts: Object.keys(pins),
  };
}
