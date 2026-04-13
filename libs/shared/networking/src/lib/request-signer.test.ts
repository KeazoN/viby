import { RequestSigner } from './request-signer';

describe('RequestSigner', () => {
  let signer: RequestSigner;

  beforeEach(() => {
    // Set a test signing key
    process.env.EXPO_PUBLIC_REQUEST_SIGNING_KEY = 'test-secret-key-12345';
    signer = new RequestSigner();
  });

  afterEach(() => {
    delete process.env.EXPO_PUBLIC_REQUEST_SIGNING_KEY;
  });

  describe('sign', () => {
    it('should generate a signature for a POST request', () => {
      const method = 'POST';
      const url = '/matchmaking/123/accept';
      const body = { matchId: '123' };
      const timestamp = 1234567890000;

      const signature = signer.sign(method, url, body, timestamp);

      expect(signature).toBeDefined();
      expect(typeof signature).toBe('string');
      expect(signature.length).toBeGreaterThan(0);
    });

    it('should generate different signatures for different methods', () => {
      const url = '/matchmaking/123/accept';
      const body = { matchId: '123' };
      const timestamp = 1234567890000;

      const postSignature = signer.sign('POST', url, body, timestamp);
      const putSignature = signer.sign('PUT', url, body, timestamp);

      expect(postSignature).not.toBe(putSignature);
    });

    it('should generate different signatures for different URLs', () => {
      const method = 'POST';
      const body = { matchId: '123' };
      const timestamp = 1234567890000;

      const signature1 = signer.sign(method, '/matchmaking/123/accept', body, timestamp);
      const signature2 = signer.sign(method, '/matchmaking/456/accept', body, timestamp);

      expect(signature1).not.toBe(signature2);
    });

    it('should generate different signatures for different bodies', () => {
      const method = 'POST';
      const url = '/matchmaking/123/accept';
      const timestamp = 1234567890000;

      const signature1 = signer.sign(method, url, { matchId: '123' }, timestamp);
      const signature2 = signer.sign(method, url, { matchId: '456' }, timestamp);

      expect(signature1).not.toBe(signature2);
    });

    it('should generate different signatures for different timestamps', () => {
      const method = 'POST';
      const url = '/matchmaking/123/accept';
      const body = { matchId: '123' };

      const signature1 = signer.sign(method, url, body, 1234567890000);
      const signature2 = signer.sign(method, url, body, 1234567890001);

      expect(signature1).not.toBe(signature2);
    });

    it('should handle null/undefined body', () => {
      const method = 'POST';
      const url = '/matchmaking/123/accept';
      const timestamp = 1234567890000;

      const signature1 = signer.sign(method, url, null, timestamp);
      const signature2 = signer.sign(method, url, undefined, timestamp);

      expect(signature1).toBeDefined();
      expect(signature2).toBeDefined();
      expect(signature1).toBe(signature2); // Both should treat as empty object
    });

    it('should generate consistent signatures for the same input', () => {
      const method = 'POST';
      const url = '/matchmaking/123/accept';
      const body = { matchId: '123' };
      const timestamp = 1234567890000;

      const signature1 = signer.sign(method, url, body, timestamp);
      const signature2 = signer.sign(method, url, body, timestamp);

      expect(signature1).toBe(signature2);
    });
  });

  describe('verify', () => {
    it('should verify a valid signature', () => {
      const method = 'POST';
      const url = '/matchmaking/123/accept';
      const body = { matchId: '123' };
      const timestamp = 1234567890000;

      const signature = signer.sign(method, url, body, timestamp);
      const isValid = signer.verify(signature, method, url, body, timestamp);

      expect(isValid).toBe(true);
    });

    it('should reject an invalid signature', () => {
      const method = 'POST';
      const url = '/matchmaking/123/accept';
      const body = { matchId: '123' };
      const timestamp = 1234567890000;

      const invalidSignature = 'invalid-signature-12345';
      const isValid = signer.verify(invalidSignature, method, url, body, timestamp);

      expect(isValid).toBe(false);
    });

    it('should reject a signature with modified method', () => {
      const url = '/matchmaking/123/accept';
      const body = { matchId: '123' };
      const timestamp = 1234567890000;

      const signature = signer.sign('POST', url, body, timestamp);
      const isValid = signer.verify(signature, 'PUT', url, body, timestamp);

      expect(isValid).toBe(false);
    });

    it('should reject a signature with modified URL', () => {
      const method = 'POST';
      const body = { matchId: '123' };
      const timestamp = 1234567890000;

      const signature = signer.sign(method, '/matchmaking/123/accept', body, timestamp);
      const isValid = signer.verify(signature, method, '/matchmaking/456/accept', body, timestamp);

      expect(isValid).toBe(false);
    });

    it('should reject a signature with modified body', () => {
      const method = 'POST';
      const url = '/matchmaking/123/accept';
      const timestamp = 1234567890000;

      const signature = signer.sign(method, url, { matchId: '123' }, timestamp);
      const isValid = signer.verify(signature, method, url, { matchId: '456' }, timestamp);

      expect(isValid).toBe(false);
    });

    it('should reject a signature with modified timestamp', () => {
      const method = 'POST';
      const url = '/matchmaking/123/accept';
      const body = { matchId: '123' };

      const signature = signer.sign(method, url, body, 1234567890000);
      const isValid = signer.verify(signature, method, url, body, 1234567890001);

      expect(isValid).toBe(false);
    });
  });

  describe('isEnabled', () => {
    it('should return true when signing key is configured', () => {
      expect(signer.isEnabled()).toBe(true);
    });

    it('should return false when signing key is not configured', () => {
      delete process.env.EXPO_PUBLIC_REQUEST_SIGNING_KEY;
      const signerWithoutKey = new RequestSigner();

      expect(signerWithoutKey.isEnabled()).toBe(false);
    });
  });

  describe('security properties', () => {
    it('should prevent replay attacks with different timestamps', () => {
      const method = 'POST';
      const url = '/matchmaking/123/accept';
      const body = { matchId: '123' };
      const timestamp1 = Date.now();
      const timestamp2 = timestamp1 + 1000; // 1 second later

      const signature1 = signer.sign(method, url, body, timestamp1);
      const signature2 = signer.sign(method, url, body, timestamp2);

      // Same request at different times should have different signatures
      expect(signature1).not.toBe(signature2);

      // Signature from timestamp1 should not be valid for timestamp2
      expect(signer.verify(signature1, method, url, body, timestamp2)).toBe(false);
    });

    it('should prevent tampering with request body', () => {
      const method = 'POST';
      const url = '/game/room123/answer';
      const originalBody = { roomId: 'room123', roundId: 'round1', answer: 'A' };
      const tamperedBody = { roomId: 'room123', roundId: 'round1', answer: 'B' };
      const timestamp = Date.now();

      const signature = signer.sign(method, url, originalBody, timestamp);

      // Signature should not be valid for tampered body
      expect(signer.verify(signature, method, url, tamperedBody, timestamp)).toBe(false);
    });

    it('should prevent tampering with URL', () => {
      const method = 'POST';
      const body = { matchId: '123' };
      const timestamp = Date.now();
      const originalUrl = '/matchmaking/123/accept';
      const tamperedUrl = '/matchmaking/456/accept';

      const signature = signer.sign(method, originalUrl, body, timestamp);

      // Signature should not be valid for tampered URL
      expect(signer.verify(signature, method, tamperedUrl, body, timestamp)).toBe(false);
    });
  });
});
