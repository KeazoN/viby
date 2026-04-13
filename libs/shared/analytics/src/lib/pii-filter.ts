/**
 * PII Filter
 * 
 * Filters personally identifiable information from analytics events
 */

import { PII_PATTERNS, SENSITIVE_KEYS, AnalyticsEventProperties } from './types';

/**
 * Filters PII from a string value
 */
export function filterPIIFromString(value: string): string {
  let filtered = value;
  
  // Replace email addresses
  filtered = filtered.replace(PII_PATTERNS.EMAIL, '[EMAIL_REDACTED]');
  
  // Replace phone numbers
  filtered = filtered.replace(PII_PATTERNS.PHONE, '[PHONE_REDACTED]');
  
  // Replace tokens
  filtered = filtered.replace(PII_PATTERNS.TOKEN, '[TOKEN_REDACTED]');
  
  // Replace credit card numbers
  filtered = filtered.replace(PII_PATTERNS.CREDIT_CARD, '[CARD_REDACTED]');
  
  // Replace SSN
  filtered = filtered.replace(PII_PATTERNS.SSN, '[SSN_REDACTED]');
  
  // Replace IP addresses
  filtered = filtered.replace(PII_PATTERNS.IP_ADDRESS, '[IP_REDACTED]');
  
  return filtered;
}

/**
 * Checks if a key is sensitive
 */
export function isSensitiveKey(key: string): boolean {
  const lowerKey = key.toLowerCase();
  return SENSITIVE_KEYS.some(sensitiveKey => 
    lowerKey.includes(sensitiveKey.toLowerCase())
  );
}

/**
 * Filters PII from event properties
 */
export function filterPIIFromProperties(
  properties: AnalyticsEventProperties
): AnalyticsEventProperties {
  const filtered: AnalyticsEventProperties = {};
  
  for (const [key, value] of Object.entries(properties)) {
    // Skip sensitive keys entirely
    if (isSensitiveKey(key)) {
      filtered[key] = '[REDACTED]';
      continue;
    }
    
    // Filter string values
    if (typeof value === 'string') {
      filtered[key] = filterPIIFromString(value);
    } else if (typeof value === 'object' && value !== null) {
      // Recursively filter nested objects
      filtered[key] = JSON.stringify(
        filterPIIFromProperties(value as AnalyticsEventProperties)
      );
    } else {
      // Keep numbers, booleans, and undefined as-is
      filtered[key] = value;
    }
  }
  
  return filtered;
}

/**
 * Validates that properties don't contain PII after filtering
 * Returns true if properties are safe to send
 */
export function validateNoPII(properties: AnalyticsEventProperties): boolean {
  const stringified = JSON.stringify(properties);
  
  // Check for email patterns
  if (PII_PATTERNS.EMAIL.test(stringified)) {
    console.warn('[Analytics] PII detected: email pattern found');
    return false;
  }
  
  // Check for phone patterns
  if (PII_PATTERNS.PHONE.test(stringified)) {
    console.warn('[Analytics] PII detected: phone pattern found');
    return false;
  }
  
  // Check for token patterns
  if (PII_PATTERNS.TOKEN.test(stringified)) {
    console.warn('[Analytics] PII detected: token pattern found');
    return false;
  }
  
  // Check for credit card patterns
  if (PII_PATTERNS.CREDIT_CARD.test(stringified)) {
    console.warn('[Analytics] PII detected: credit card pattern found');
    return false;
  }
  
  return true;
}
