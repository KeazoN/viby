import {
  secureFetch,
  initializeCertificatePinning,
  isCertificatePinningAvailable,
  getCertificatePinningStatus,
  CertificatePinningError,
} from './secure-fetch';
import { CERTIFICATE_PINS } from './certificate-pinning';

// Mock global fetch
global.fetch = jest.fn();

describe('Secure Fetch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
  });

  describe('secureFetch', () => {
    it('should call fetch with correct URL and options', async () => {
      await secureFetch('https://api.viby.app/users', {
        method: 'GET',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.viby.app/users',
        { method: 'GET' }
      );
    });

    it('should validate certificate pinning configuration', async () => {
      // Should not throw for configured hostname
      await expect(
        secureFetch('https://api.viby.app/users', {
          certificatePinning: {
            enabled: true,
            strictMode: false,
          },
        })
      ).resolves.toBeDefined();
    });

    it('should throw error in strict mode for unconfigured hostname', async () => {
      await expect(
        secureFetch('https://unknown.example.com/api', {
          certificatePinning: {
            enabled: true,
            strictMode: true,
          },
        })
      ).rejects.toThrow(CertificatePinningError);
    });

    it('should warn in non-strict mode for unconfigured hostname', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      await secureFetch('https://unknown.example.com/api', {
        certificatePinning: {
          enabled: true,
          strictMode: false,
        },
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('No pins configured')
      );

      consoleWarnSpy.mockRestore();
    });

    it('should skip validation when pinning is disabled', async () => {
      await expect(
        secureFetch('https://unknown.example.com/api', {
          certificatePinning: {
            enabled: false,
            strictMode: true,
          },
        })
      ).resolves.toBeDefined();
    });

    it('should use default configuration when not specified', async () => {
      await secureFetch('https://api.viby.app/users');
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should pass through fetch options', async () => {
      const headers = { 'X-Custom-Header': 'value' };
      
      await secureFetch('https://api.viby.app/users', {
        method: 'POST',
        headers,
        body: JSON.stringify({ data: 'test' }),
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.viby.app/users',
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ data: 'test' }),
        }
      );
    });

    it('should handle custom certificate pins', async () => {
      const customPins = {
        'custom.example.com': ['sha256/CUSTOM_HASH='],
      };

      await secureFetch('https://custom.example.com/api', {
        certificatePinning: {
          enabled: true,
          strictMode: false,
          customPins,
        },
      });

      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('CertificatePinningError', () => {
    it('should create error with correct properties', () => {
      const error = new CertificatePinningError(
        'Test error',
        'example.com',
        'https://example.com/api'
      );

      expect(error.message).toBe('Test error');
      expect(error.hostname).toBe('example.com');
      expect(error.url).toBe('https://example.com/api');
      expect(error.name).toBe('CertificatePinningError');
    });

    it('should be instanceof Error', () => {
      const error = new CertificatePinningError(
        'Test error',
        'example.com',
        'https://example.com/api'
      );

      expect(error instanceof Error).toBe(true);
    });
  });

  describe('initializeCertificatePinning', () => {
    it('should validate certificate pins in development', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      initializeCertificatePinning();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Validating configuration')
      );

      consoleLogSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });

    it('should warn about production mode', () => {
      const originalEnv = process.env.EXPO_PUBLIC_ENV;
      process.env.EXPO_PUBLIC_ENV = 'production';

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      initializeCertificatePinning();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Production mode detected')
      );

      consoleWarnSpy.mockRestore();
      process.env.EXPO_PUBLIC_ENV = originalEnv;
    });
  });

  describe('isCertificatePinningAvailable', () => {
    it('should return false for validation-only implementation', () => {
      expect(isCertificatePinningAvailable()).toBe(false);
    });
  });

  describe('getCertificatePinningStatus', () => {
    it('should return correct status object', () => {
      const status = getCertificatePinningStatus();

      expect(status).toHaveProperty('available');
      expect(status).toHaveProperty('enabled');
      expect(status).toHaveProperty('strictMode');
      expect(status).toHaveProperty('configuredHosts');

      expect(typeof status.available).toBe('boolean');
      expect(typeof status.enabled).toBe('boolean');
      expect(typeof status.strictMode).toBe('boolean');
      expect(Array.isArray(status.configuredHosts)).toBe(true);
    });

    it('should include all configured hosts', () => {
      const status = getCertificatePinningStatus();
      const configuredHosts = Object.keys(CERTIFICATE_PINS);

      expect(status.configuredHosts).toEqual(configuredHosts);
    });

    it('should reflect environment configuration', () => {
      const status = getCertificatePinningStatus();

      if (process.env.EXPO_PUBLIC_ENV === 'production') {
        expect(status.enabled).toBe(true);
        expect(status.strictMode).toBe(true);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(
        secureFetch('https://api.viby.app/users')
      ).rejects.toThrow('Network error');
    });

    it('should handle invalid URLs', async () => {
      await expect(
        secureFetch('not-a-valid-url', {
          certificatePinning: {
            enabled: true,
            strictMode: true,
          },
        })
      ).rejects.toThrow();
    });
  });

  describe('Development Mode', () => {
    it('should log info message in development when pinning is enabled', async () => {
      const consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();

      await secureFetch('https://api.viby.app/users', {
        certificatePinning: {
          enabled: true,
        },
      });

      if (__DEV__) {
        expect(consoleInfoSpy).toHaveBeenCalledWith(
          expect.stringContaining('Using standard fetch')
        );
      }

      consoleInfoSpy.mockRestore();
    });
  });

  describe('Configuration Merging', () => {
    it('should merge partial config with defaults', async () => {
      // Should not throw even with partial config
      await expect(
        secureFetch('https://api.viby.app/users', {
          certificatePinning: {
            enabled: true,
            // strictMode not specified, should use default
          },
        })
      ).resolves.toBeDefined();
    });

    it('should override defaults with provided config', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Override default to disable strict mode
      await secureFetch('https://unknown.example.com/api', {
        certificatePinning: {
          enabled: true,
          strictMode: false, // Override default
        },
      });

      // Should warn instead of throwing
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });
});
