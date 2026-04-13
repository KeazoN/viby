/**
 * Profanity Filter
 * 
 * Content moderation utility for filtering inappropriate language in chat messages.
 * Uses a pattern-based approach to detect and filter profanity.
 * 
 * Requirements: 24.5
 */

/**
 * List of profane words and patterns to filter.
 * This is a basic list - in production, this should be more comprehensive
 * and potentially loaded from a backend service for easier updates.
 */
const PROFANITY_PATTERNS = [
  // Common profanity (basic list for app store compliance)
  /\b(fuck|shit|damn|bitch|ass|crap|hell|bastard|dick|piss|cock|pussy|cunt|whore|slut)\b/gi,
  // Variations with special characters
  /f[\*\-_]?u[\*\-_]?c[\*\-_]?k/gi,
  /s[\*\-_]?h[\*\-_]?i[\*\-_]?t/gi,
  /b[\*\-_]?i[\*\-_]?t[\*\-_]?c[\*\-_]?h/gi,
  // Leetspeak variations
  /f[u4]ck/gi,
  /sh[i1]t/gi,
  /b[i1]tch/gi,
];

/**
 * Replacement character for filtered content
 */
const REPLACEMENT_CHAR = '*';

/**
 * Check if a message contains profanity
 * @param message - The message to check
 * @returns true if profanity is detected, false otherwise
 */
export function containsProfanity(message: string): boolean {
  if (!message || typeof message !== 'string') {
    return false;
  }

  return PROFANITY_PATTERNS.some(pattern => pattern.test(message));
}

/**
 * Filter profanity from a message by replacing it with asterisks
 * @param message - The message to filter
 * @returns The filtered message with profanity replaced
 */
export function filterProfanity(message: string): string {
  if (!message || typeof message !== 'string') {
    return message;
  }

  let filtered = message;

  PROFANITY_PATTERNS.forEach(pattern => {
    filtered = filtered.replace(pattern, (match) => {
      // Replace each character with an asterisk, preserving length
      return REPLACEMENT_CHAR.repeat(match.length);
    });
  });

  return filtered;
}

/**
 * Validate and filter a message before sending
 * @param message - The message to validate
 * @returns Object with validation result and filtered message
 */
export function validateAndFilterMessage(message: string): {
  isValid: boolean;
  filtered: string;
  containsProfanity: boolean;
  reason?: string;
} {
  if (!message || typeof message !== 'string') {
    return {
      isValid: false,
      filtered: '',
      containsProfanity: false,
      reason: 'Message is empty or invalid',
    };
  }

  const trimmed = message.trim();

  if (trimmed.length === 0) {
    return {
      isValid: false,
      filtered: '',
      containsProfanity: false,
      reason: 'Message is empty',
    };
  }

  if (trimmed.length > 500) {
    return {
      isValid: false,
      filtered: trimmed,
      containsProfanity: false,
      reason: 'Message exceeds 500 characters',
    };
  }

  const hasProfanity = containsProfanity(trimmed);
  const filtered = hasProfanity ? filterProfanity(trimmed) : trimmed;

  return {
    isValid: true,
    filtered,
    containsProfanity: hasProfanity,
  };
}
