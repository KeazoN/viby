# Certificate Pinning Implementation Guide

## Overview

Certificate pinning (also known as SSL pinning) is a security technique that ensures the mobile app only trusts specific SSL certificates when communicating with the backend API. This prevents man-in-the-middle (MITM) attacks even if a device's root certificate store is compromised.

## Current Implementation Status

The current implementation provides:
- ✅ Certificate pinning configuration structure
- ✅ Validation layer for certificate pins
- ✅ Environment-based configuration
- ✅ Development warnings and error handling
- ⚠️ **Validation-only mode** (not enforcing actual SSL pinning)

## Production Deployment Requirements

To enable **actual SSL certificate pinning** in production, you must:

### 1. Install Native SSL Pinning Module

Choose one of these options:

#### Option A: react-native-ssl-pinning (Recommended)
```bash
npm install react-native-ssl-pinning
cd ios && pod install
```

#### Option B: expo-ssl-pinning (For Expo managed workflow)
```bash
npx expo install expo-ssl-pinning
```

**Note**: SSL pinning requires a custom development client. You cannot use Expo Go.

### 2. Extract Certificate Hashes

Extract the SHA-256 hash of your backend's SSL certificate:

```bash
# Method 1: From a running server
openssl s_client -connect api.viby.app:443 -servername api.viby.app < /dev/null | \
  openssl x509 -pubkey -noout | \
  openssl pkey -pubin -outform der | \
  openssl dgst -sha256 -binary | \
  openssl enc -base64

# Method 2: From a certificate file
openssl x509 -in certificate.crt -pubkey -noout | \
  openssl pkey -pubin -outform der | \
  openssl dgst -sha256 -binary | \
  openssl enc -base64
```

This will output a base64-encoded hash like:
```
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=
```

### 3. Update Certificate Configuration

Edit `libs/shared/networking/src/lib/certificate-pinning.ts`:

```typescript
export const CERTIFICATE_PINS: Record<string, string[]> = {
  'api.viby.app': [
    // Replace with your actual certificate hash
    'sha256/YOUR_ACTUAL_CERTIFICATE_HASH_HERE=',
    // Add backup certificate for rotation
    'sha256/YOUR_BACKUP_CERTIFICATE_HASH_HERE=',
  ],
  'api-staging.viby.app': [
    'sha256/STAGING_CERTIFICATE_HASH_HERE=',
  ],
};
```

### 4. Configure Native Builds

#### iOS Configuration

Edit `ios/Podfile` to include SSL pinning:

```ruby
pod 'react-native-ssl-pinning', :path => '../node_modules/react-native-ssl-pinning'
```

#### Android Configuration

Edit `android/app/build.gradle`:

```gradle
dependencies {
    implementation project(':react-native-ssl-pinning')
}
```

### 5. Update Secure Fetch Implementation

Replace the TODO in `libs/shared/networking/src/lib/secure-fetch.ts`:

```typescript
import { fetch as sslFetch } from 'react-native-ssl-pinning';

export async function secureFetch(
  url: string,
  options: SecureFetchOptions = {}
): Promise<Response> {
  const { certificatePinning, ...fetchOptions } = options;
  
  const config: CertificatePinningConfig = {
    ...DEFAULT_CERT_PINNING_CONFIG,
    ...certificatePinning,
  };

  validatePinningConfig(url, config);

  if (!config.enabled) {
    return fetch(url, fetchOptions);
  }

  const hostname = extractHostname(url);
  const pins = getEffectivePins(config)[hostname];

  // Use native SSL pinning
  return sslFetch(url, {
    ...fetchOptions,
    sslPinning: {
      certs: pins,
    },
  });
}
```

## Configuration

### Environment Variables

Certificate pinning is controlled by environment variables:

```bash
# Enable certificate pinning
EXPO_PUBLIC_CERT_PINNING_ENABLED=true

# Fail requests if no pins configured (strict mode)
EXPO_PUBLIC_CERT_PINNING_STRICT=true
```

### Recommended Settings

| Environment | ENABLED | STRICT | Rationale |
|-------------|---------|--------|-----------|
| Development | false   | false  | Allow localhost and self-signed certs |
| Staging     | true    | true   | Test pinning before production |
| Production  | true    | true   | Maximum security |

## Usage

### Automatic (via HttpClient)

Certificate pinning is automatically initialized when creating an `HttpClient` instance:

```typescript
import { httpClient } from '@viby/shared/networking';

// All requests through httpClient will validate certificate pinning
const data = await httpClient.get('/api/users');
```

### Manual (via secureFetch)

For custom fetch requests:

```typescript
import { secureFetch } from '@viby/shared/networking';

const response = await secureFetch('https://api.viby.app/users', {
  method: 'GET',
  certificatePinning: {
    enabled: true,
    strictMode: true,
  },
});
```

## Certificate Rotation

To rotate certificates without breaking the app:

1. **Add new certificate hash** to the pins array BEFORE rotating on the server
2. **Deploy app update** with both old and new certificate hashes
3. **Wait for users to update** (monitor adoption rate)
4. **Rotate certificate** on the server
5. **Remove old hash** in next app update

Example:

```typescript
export const CERTIFICATE_PINS: Record<string, string[]> = {
  'api.viby.app': [
    'sha256/OLD_CERT_HASH=',  // Keep during transition
    'sha256/NEW_CERT_HASH=',  // Add before server rotation
  ],
};
```

## Debugging

### Check Certificate Pinning Status

```typescript
import { getCertificatePinningStatus } from '@viby/shared/networking';

const status = getCertificatePinningStatus();
console.log('Certificate Pinning Status:', status);
// {
//   available: true,
//   enabled: true,
//   strictMode: true,
//   configuredHosts: ['api.viby.app', 'api-staging.viby.app']
// }
```

### Common Issues

#### Issue: "No certificate pins configured"

**Cause**: Hostname not in `CERTIFICATE_PINS` configuration

**Solution**: Add the hostname and certificate hashes to `certificate-pinning.ts`

#### Issue: "Certificate pinning failed"

**Cause**: Certificate hash mismatch

**Solutions**:
1. Verify certificate hash is correct
2. Check if certificate was rotated on server
3. Ensure you're extracting the public key hash, not the certificate hash

#### Issue: "SSL pinning not working in development"

**Cause**: Using Expo Go instead of custom development client

**Solution**: Build a custom development client with `expo-dev-client`

## Testing

### Unit Tests

Test certificate pinning configuration:

```typescript
import { getCertificatePins, hasCertificatePins } from './certificate-pinning';

describe('Certificate Pinning', () => {
  it('should have pins configured for production API', () => {
    expect(hasCertificatePins('api.viby.app')).toBe(true);
  });

  it('should return certificate pins for configured hosts', () => {
    const pins = getCertificatePins('api.viby.app');
    expect(pins).toBeDefined();
    expect(pins!.length).toBeGreaterThan(0);
  });
});
```

### Integration Tests

Test with a test server that has a known certificate:

```typescript
import { secureFetch } from './secure-fetch';

describe('Secure Fetch Integration', () => {
  it('should successfully fetch with valid certificate', async () => {
    const response = await secureFetch('https://api.viby.app/health');
    expect(response.ok).toBe(true);
  });

  it('should fail with invalid certificate', async () => {
    await expect(
      secureFetch('https://invalid-cert.example.com/api')
    ).rejects.toThrow();
  });
});
```

## Security Best Practices

1. **Never commit actual certificate hashes to public repositories**
   - Use environment variables or secure configuration management
   - Consider using encrypted configuration files

2. **Always pin at least 2 certificates**
   - Primary certificate
   - Backup certificate for rotation

3. **Monitor certificate expiration**
   - Set up alerts for certificates expiring within 30 days
   - Plan rotation well in advance

4. **Test certificate rotation in staging**
   - Verify app continues working with new certificate
   - Test with both old and new certificates

5. **Have a kill switch**
   - Implement remote configuration to disable pinning if needed
   - Use for emergency certificate rotation

## References

- [OWASP Mobile Security Testing Guide - Certificate Pinning](https://mobile-security.gitbook.io/mobile-security-testing-guide/general-mobile-app-testing-guide/0x04f-testing-network-communication#certificate-pinning)
- [Expo Custom Development Client](https://docs.expo.dev/develop/development-builds/introduction/)
- [react-native-ssl-pinning Documentation](https://github.com/MaxToyberman/react-native-ssl-pinning)

## Support

For issues or questions about certificate pinning implementation:
1. Check this documentation
2. Review the code in `libs/shared/networking/src/lib/certificate-pinning.ts`
3. Consult the security team for certificate management
