/**
 * PII Filter Tests
 */

import {
  filterPIIFromString,
  filterPIIFromProperties,
  isSensitiveKey,
  validateNoPII,
} from './pii-filter';

describe('PII Filter', () => {
  describe('filterPIIFromString', () => {
    it('should filter email addresses', () => {
      const input = 'Contact me at john.doe@example.com for details';
      const result = filterPIIFromString(input);
      expect(result).toBe('Contact me at [EMAIL_REDACTED] for details');
      expect(result).not.toContain('john.doe@example.com');
    });

    it('should filter phone numbers', () => {
      const input = 'Call me at 555-123-4567 or (555) 987-6543';
      const result = filterPIIFromString(input);
      expect(result).toContain('[PHONE_REDACTED]');
      expect(result).not.toContain('555-123-4567');
    });

    it('should filter tokens', () => {
      const input = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
      const result = filterPIIFromString(input);
      expect(result).toContain('[TOKEN_REDACTED]');
    });

    it('should filter credit card numbers', () => {
      const input = 'Card: 4532-1234-5678-9010';
      const result = filterPIIFromString(input);
      expect(result).toContain('[CARD_REDACTED]');
      expect(result).not.toContain('4532-1234-5678-9010');
    });

    it('should filter SSN', () => {
      const input = 'SSN: 123-45-6789';
      const result = filterPIIFromString(input);
      expect(result).toContain('[SSN_REDACTED]');
      expect(result).not.toContain('123-45-6789');
    });

    it('should filter IP addresses', () => {
      const input = 'Server IP: 192.168.1.1';
      const result = filterPIIFromString(input);
      expect(result).toContain('[IP_REDACTED]');
      expect(result).not.toContain('192.168.1.1');
    });

    it('should handle strings with no PII', () => {
      const input = 'This is a safe string with no PII';
      const result = filterPIIFromString(input);
      expect(result).toBe(input);
    });
  });

  describe('isSensitiveKey', () => {
    it('should identify password keys', () => {
      expect(isSensitiveKey('password')).toBe(true);
      expect(isSensitiveKey('userPassword')).toBe(true);
      expect(isSensitiveKey('PASSWORD')).toBe(true);
    });

    it('should identify token keys', () => {
      expect(isSensitiveKey('token')).toBe(true);
      expect(isSensitiveKey('accessToken')).toBe(true);
      expect(isSensitiveKey('refresh_token')).toBe(true);
    });

    it('should identify email keys', () => {
      expect(isSensitiveKey('email')).toBe(true);
      expect(isSensitiveKey('userEmail')).toBe(true);
      expect(isSensitiveKey('EMAIL_ADDRESS')).toBe(true);
    });

    it('should not flag safe keys', () => {
      expect(isSensitiveKey('username')).toBe(false);
      expect(isSensitiveKey('userId')).toBe(false);
      expect(isSensitiveKey('screenName')).toBe(false);
    });
  });

  describe('filterPIIFromProperties', () => {
    it('should filter sensitive keys', () => {
      const properties = {
        username: 'john_doe',
        password: 'secret123',
        email: 'john@example.com',
        age: 25,
      };

      const result = filterPIIFromProperties(properties);

      expect(result.username).toBe('john_doe');
      expect(result.password).toBe('[REDACTED]');
      expect(result.email).toBe('[REDACTED]');
      expect(result.age).toBe(25);
    });

    it('should filter PII from string values', () => {
      const properties = {
        message: 'Contact me at john@example.com',
        userId: '12345',
      };

      const result = filterPIIFromProperties(properties);

      expect(result.message).toContain('[EMAIL_REDACTED]');
      expect(result.message).not.toContain('john@example.com');
      expect(result.userId).toBe('12345');
    });

    it('should handle nested objects', () => {
      const properties = {
        user: {
          name: 'John',
          email: 'john@example.com',
        },
        count: 5,
      };

      const result = filterPIIFromProperties(properties);

      expect(result.count).toBe(5);
      expect(typeof result.user).toBe('string');
      const parsedUser = JSON.parse(result.user as string);
      expect(parsedUser.email).toBe('[REDACTED]');
    });

    it('should preserve boolean and number values', () => {
      const properties = {
        isActive: true,
        count: 42,
        ratio: 3.14,
      };

      const result = filterPIIFromProperties(properties);

      expect(result.isActive).toBe(true);
      expect(result.count).toBe(42);
      expect(result.ratio).toBe(3.14);
    });

    it('should handle undefined values', () => {
      const properties = {
        name: 'John',
        middleName: undefined,
      };

      const result = filterPIIFromProperties(properties);

      expect(result.name).toBe('John');
      expect(result.middleName).toBeUndefined();
    });
  });

  describe('validateNoPII', () => {
    it('should return true for safe properties', () => {
      const properties = {
        screenName: 'HomeScreen',
        userId: '12345',
        count: 10,
      };

      expect(validateNoPII(properties)).toBe(true);
    });

    it('should return false if email is present', () => {
      const properties = {
        screenName: 'HomeScreen',
        message: 'Contact john@example.com',
      };

      expect(validateNoPII(properties)).toBe(false);
    });

    it('should return false if phone is present', () => {
      const properties = {
        screenName: 'HomeScreen',
        contact: '555-123-4567',
      };

      expect(validateNoPII(properties)).toBe(false);
    });

    it('should return false if token is present', () => {
      const properties = {
        screenName: 'HomeScreen',
        auth: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
      };

      expect(validateNoPII(properties)).toBe(false);
    });

    it('should return false if credit card is present', () => {
      const properties = {
        screenName: 'HomeScreen',
        payment: '4532-1234-5678-9010',
      };

      expect(validateNoPII(properties)).toBe(false);
    });
  });
});
