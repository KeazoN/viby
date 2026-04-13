import {
  CERTIFICATE_PINS,
  getCertificatePins,
  hasCertificatePins,
  validateCertificatePins,
  extractHostname,
  getEffectivePins,
  DEFAULT_CERT_PINNING_CONFIG,
} from './certificate-pinning';

describe('Certificate Pinning', () => {
  describe('getCertificatePins', () => {
    it('should return pins for configured hostname', () => {
      const pins = getCertificatePins('api.viby.app');
      expect(pins).toBeDefined();
      expect(Array.isArray(pins)).toBe(true);
      expect(pins!.length).toBeGreaterThan(0);
    });

    it('should return undefined for unconfigured hostname', () => {
      const pins = getCertificatePins('unknown.example.com');
      expect(pins).toBeUndefined();
    });

    it('should return pins for staging API', () => {
      const pins = getCertificatePins('api-staging.viby.app');
      expect(pins).toBeDefined();
      expect(Array.isArray(pins)).toBe(true);
    });
  });

  describe('hasCertificatePins', () => {
    it('should return true for configured hostname', () => {
      expect(hasCertificatePins('api.viby.app')).toBe(true);
    });

    it('should return false for unconfigured hostname', () => {
      expect(hasCertificatePins('unknown.example.com')).toBe(false);
    });

    it('should return false for hostname with empty pins array', () => {
      // Temporarily modify CERTIFICATE_PINS for this test
      const originalPins = CERTIFICATE_PINS['test.example.com'];
      CERTIFICATE_PINS['test.example.com'] = [];
      
      expect(hasCertificatePins('test.example.com')).toBe(false);
      
      // Restore original state
      if (originalPins) {
        CERTIFICATE_PINS['test.example.com'] = originalPins;
      } else {
        delete CERTIFICATE_PINS['test.example.com'];
      }
    });
  });

  describe('validateCertificatePins', () => {
    let consoleWarnSpy: jest.SpyInstance;
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      consoleWarnSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should warn about placeholder certificate hashes', () => {
      validateCertificatePins();
      
      // Should warn about placeholder hashes (AAAA, BBBB, CCCC)
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleWarnSpy.mock.calls[0][0]).toContain('Placeholder certificate hash detected');
    });

    it('should validate certificate hash format', () => {
      // All configured pins should start with 'sha256/'
      Object.values(CERTIFICATE_PINS).forEach(pins => {
        pins.forEach(pin => {
          expect(pin).toMatch(/^sha256\//);
        });
      });
    });
  });

  describe('extractHostname', () => {
    it('should extract hostname from HTTPS URL', () => {
      const hostname = extractHostname('https://api.viby.app/users');
      expect(hostname).toBe('api.viby.app');
    });

    it('should extract hostname from HTTP URL', () => {
      const hostname = extractHostname('http://localhost:3000/api');
      expect(hostname).toBe('localhost');
    });

    it('should extract hostname from URL with port', () => {
      const hostname = extractHostname('https://api.viby.app:8443/users');
      expect(hostname).toBe('api.viby.app');
    });

    it('should extract hostname from URL with query params', () => {
      const hostname = extractHostname('https://api.viby.app/users?page=1');
      expect(hostname).toBe('api.viby.app');
    });

    it('should throw error for invalid URL', () => {
      expect(() => extractHostname('not-a-url')).toThrow('Invalid URL');
    });
  });

  describe('getEffectivePins', () => {
    it('should return default pins when no custom pins provided', () => {
      const config = { ...DEFAULT_CERT_PINNING_CONFIG };
      const pins = getEffectivePins(config);
      expect(pins).toBe(CERTIFICATE_PINS);
    });

    it('should return custom pins when provided', () => {
      const customPins = {
        'custom.example.com': ['sha256/CUSTOM_HASH='],
      };
      const config = {
        ...DEFAULT_CERT_PINNING_CONFIG,
        customPins,
      };
      const pins = getEffectivePins(config);
      expect(pins).toBe(customPins);
    });
  });

  describe('DEFAULT_CERT_PINNING_CONFIG', () => {
    it('should enable pinning in production', () => {
      const originalEnv = process.env.EXPO_PUBLIC_ENV;
      process.env.EXPO_PUBLIC_ENV = 'production';
      
      // Re-import to get updated config
      jest.resetModules();
      const { DEFAULT_CERT_PINNING_CONFIG: prodConfig } = require('./certificate-pinning');
      
      expect(prodConfig.enabled).toBe(true);
      expect(prodConfig.strictMode).toBe(true);
      
      process.env.EXPO_PUBLIC_ENV = originalEnv;
    });

    it('should have customPins as undefined by default', () => {
      expect(DEFAULT_CERT_PINNING_CONFIG.customPins).toBeUndefined();
    });
  });

  describe('Certificate Pin Format', () => {
    it('should have all pins in correct format', () => {
      Object.entries(CERTIFICATE_PINS).forEach(([hostname, pins]) => {
        pins.forEach((pin, index) => {
          // Should start with sha256/
          expect(pin).toMatch(/^sha256\//);
          
          // Should be base64 encoded (alphanumeric + / + = + -)
          const base64Part = pin.substring(7); // Remove 'sha256/'
          expect(base64Part).toMatch(/^[A-Za-z0-9+/]+=*$/);
        });
      });
    });

    it('should have at least one pin per configured host', () => {
      Object.entries(CERTIFICATE_PINS).forEach(([hostname, pins]) => {
        expect(pins.length).toBeGreaterThan(0);
      });
    });

    it('should have production API configured', () => {
      expect(CERTIFICATE_PINS['api.viby.app']).toBeDefined();
      expect(CERTIFICATE_PINS['api.viby.app'].length).toBeGreaterThanOrEqual(1);
    });

    it('should have staging API configured', () => {
      expect(CERTIFICATE_PINS['api-staging.viby.app']).toBeDefined();
      expect(CERTIFICATE_PINS['api-staging.viby.app'].length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Certificate Rotation Support', () => {
    it('should support multiple pins for rotation', () => {
      const productionPins = CERTIFICATE_PINS['api.viby.app'];
      // Should have at least 2 pins for rotation support
      expect(productionPins.length).toBeGreaterThanOrEqual(2);
    });
  });
});
