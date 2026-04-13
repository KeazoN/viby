import CryptoJS from 'crypto-js';

/**
 * RequestSigner provides HMAC-SHA256 signing for critical API requests.
 * 
 * This prevents request tampering and replay attacks by:
 * - Signing requests with a shared secret key
 * - Including timestamp to prevent replay attacks
 * - Verifying signatures on the server side
 * 
 * Used for critical operations:
 * - Match accept
 * - Game actions (submit answer, leave game)
 * 
 * Requirements: 17.5
 */
export class RequestSigner {
  private readonly SECRET_KEY: string;

  constructor() {
    this.SECRET_KEY = process.env.EXPO_PUBLIC_REQUEST_SIGNING_KEY || '';
    
    if (!this.SECRET_KEY && __DEV__) {
      console.warn('Request signing key not configured. Set EXPO_PUBLIC_REQUEST_SIGNING_KEY in environment.');
    }
  }

  /**
   * Sign a request with HMAC-SHA256
   * @param method - HTTP method (GET, POST, PUT, DELETE)
   * @param url - Request URL path
   * @param body - Request body (will be JSON stringified)
   * @param timestamp - Request timestamp in milliseconds
   * @returns HMAC-SHA256 signature as hex string
   */
  sign(method: string, url: string, body: any, timestamp: number): string {
    // Create payload string: METHOD:URL:BODY:TIMESTAMP
    const payload = `${method}:${url}:${JSON.stringify(body || {})}:${timestamp}`;
    
    // Generate HMAC-SHA256 signature
    const signature = CryptoJS.HmacSHA256(payload, this.SECRET_KEY).toString();
    
    return signature;
  }

  /**
   * Verify a request signature (for testing purposes)
   * @param signature - The signature to verify
   * @param method - HTTP method
   * @param url - Request URL path
   * @param body - Request body
   * @param timestamp - Request timestamp
   * @returns True if signature is valid
   */
  verify(signature: string, method: string, url: string, body: any, timestamp: number): boolean {
    const expectedSignature = this.sign(method, url, body, timestamp);
    return signature === expectedSignature;
  }

  /**
   * Check if request signing is enabled
   * @returns True if signing key is configured
   */
  isEnabled(): boolean {
    return this.SECRET_KEY.length > 0;
  }
}

// Export singleton instance
export const requestSigner = new RequestSigner();
