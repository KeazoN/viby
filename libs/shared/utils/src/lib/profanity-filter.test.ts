/**
 * Tests for Profanity Filter
 * 
 * Requirements: 24.5
 */

import { containsProfanity, filterProfanity, validateAndFilterMessage } from './profanity-filter';

describe('ProfanityFilter', () => {
  describe('containsProfanity', () => {
    it('should detect basic profanity', () => {
      expect(containsProfanity('This is a fuck test')).toBe(true);
      expect(containsProfanity('What the shit')).toBe(true);
      expect(containsProfanity('You bitch')).toBe(true);
    });

    it('should detect profanity with special characters', () => {
      expect(containsProfanity('f*ck this')).toBe(true);
      expect(containsProfanity('s-h-i-t')).toBe(true);
      expect(containsProfanity('b_i_t_c_h')).toBe(true);
    });

    it('should detect leetspeak variations', () => {
      expect(containsProfanity('f4ck')).toBe(true);
      expect(containsProfanity('sh1t')).toBe(true);
      expect(containsProfanity('b1tch')).toBe(true);
    });

    it('should not detect profanity in clean messages', () => {
      expect(containsProfanity('Hello, how are you?')).toBe(false);
      expect(containsProfanity('Great music!')).toBe(false);
      expect(containsProfanity('Nice to meet you')).toBe(false);
    });

    it('should handle empty or invalid input', () => {
      expect(containsProfanity('')).toBe(false);
      expect(containsProfanity(null as any)).toBe(false);
      expect(containsProfanity(undefined as any)).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(containsProfanity('FUCK')).toBe(true);
      expect(containsProfanity('Shit')).toBe(true);
      expect(containsProfanity('BiTcH')).toBe(true);
    });
  });

  describe('filterProfanity', () => {
    it('should replace profanity with asterisks', () => {
      expect(filterProfanity('This is a fuck test')).toBe('This is a **** test');
      expect(filterProfanity('What the shit')).toBe('What the ****');
      expect(filterProfanity('You bitch')).toBe('You *****');
    });

    it('should replace profanity with special characters', () => {
      expect(filterProfanity('f*ck this')).toBe('**** this');
      expect(filterProfanity('s-h-i-t')).toBe('*******');
    });

    it('should preserve message length when filtering', () => {
      const original = 'This is a fuck test';
      const filtered = filterProfanity(original);
      expect(filtered.length).toBe(original.length);
    });

    it('should not modify clean messages', () => {
      const clean = 'Hello, how are you?';
      expect(filterProfanity(clean)).toBe(clean);
    });

    it('should handle multiple profanities', () => {
      expect(filterProfanity('fuck this shit')).toBe('**** this ****');
    });

    it('should handle empty or invalid input', () => {
      expect(filterProfanity('')).toBe('');
      expect(filterProfanity(null as any)).toBe(null);
      expect(filterProfanity(undefined as any)).toBe(undefined);
    });
  });

  describe('validateAndFilterMessage', () => {
    it('should validate and filter clean messages', () => {
      const result = validateAndFilterMessage('Hello, how are you?');
      expect(result.isValid).toBe(true);
      expect(result.filtered).toBe('Hello, how are you?');
      expect(result.containsProfanity).toBe(false);
      expect(result.reason).toBeUndefined();
    });

    it('should validate and filter messages with profanity', () => {
      const result = validateAndFilterMessage('This is a fuck test');
      expect(result.isValid).toBe(true);
      expect(result.filtered).toBe('This is a **** test');
      expect(result.containsProfanity).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should reject empty messages', () => {
      const result = validateAndFilterMessage('');
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Message is empty or invalid');
    });

    it('should reject whitespace-only messages', () => {
      const result = validateAndFilterMessage('   ');
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Message is empty');
    });

    it('should reject messages exceeding 500 characters', () => {
      const longMessage = 'a'.repeat(501);
      const result = validateAndFilterMessage(longMessage);
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Message exceeds 500 characters');
    });

    it('should trim whitespace from messages', () => {
      const result = validateAndFilterMessage('  Hello  ');
      expect(result.isValid).toBe(true);
      expect(result.filtered).toBe('Hello');
    });

    it('should handle null and undefined input', () => {
      const nullResult = validateAndFilterMessage(null as any);
      expect(nullResult.isValid).toBe(false);
      expect(nullResult.reason).toBe('Message is empty or invalid');

      const undefinedResult = validateAndFilterMessage(undefined as any);
      expect(undefinedResult.isValid).toBe(false);
      expect(undefinedResult.reason).toBe('Message is empty or invalid');
    });
  });
});
