import { signedPost, signedPut, signedDelete } from './signed-request';
import { httpClient } from './http-client';
import { requestSigner } from './request-signer';

// Mock dependencies
jest.mock('./http-client');
jest.mock('./request-signer');

describe('Signed Request Helpers', () => {
  const mockHttpClient = httpClient as jest.Mocked<typeof httpClient>;
  const mockRequestSigner = requestSigner as jest.Mocked<typeof requestSigner>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Date.now() for consistent timestamps
    jest.spyOn(Date, 'now').mockReturnValue(1234567890000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('signedPost', () => {
    it('should add signature headers when signing is enabled', async () => {
      mockRequestSigner.isEnabled.mockReturnValue(true);
      mockRequestSigner.sign.mockReturnValue('test-signature-12345');
      mockHttpClient.post.mockResolvedValue({ success: true });

      const url = '/matchmaking/123/accept';
      const data = { matchId: '123' };

      await signedPost(url, data);

      expect(mockRequestSigner.sign).toHaveBeenCalledWith('POST', url, data, 1234567890000);
      expect(mockHttpClient.post).toHaveBeenCalledWith(url, data, {
        headers: {
          'X-Request-Signature': 'test-signature-12345',
          'X-Request-Timestamp': '1234567890000',
        },
      });
    });

    it('should not add signature headers when signing is disabled', async () => {
      mockRequestSigner.isEnabled.mockReturnValue(false);
      mockHttpClient.post.mockResolvedValue({ success: true });

      const url = '/matchmaking/123/accept';
      const data = { matchId: '123' };

      await signedPost(url, data);

      expect(mockRequestSigner.sign).not.toHaveBeenCalled();
      expect(mockHttpClient.post).toHaveBeenCalledWith(url, data, undefined);
    });

    it('should merge custom headers with signature headers', async () => {
      mockRequestSigner.isEnabled.mockReturnValue(true);
      mockRequestSigner.sign.mockReturnValue('test-signature-12345');
      mockHttpClient.post.mockResolvedValue({ success: true });

      const url = '/matchmaking/123/accept';
      const data = { matchId: '123' };
      const config = {
        headers: {
          'X-Custom-Header': 'custom-value',
        },
      };

      await signedPost(url, data, config);

      expect(mockHttpClient.post).toHaveBeenCalledWith(url, data, {
        headers: {
          'X-Custom-Header': 'custom-value',
          'X-Request-Signature': 'test-signature-12345',
          'X-Request-Timestamp': '1234567890000',
        },
      });
    });

    it('should handle requests without data', async () => {
      mockRequestSigner.isEnabled.mockReturnValue(true);
      mockRequestSigner.sign.mockReturnValue('test-signature-12345');
      mockHttpClient.post.mockResolvedValue({ success: true });

      const url = '/matchmaking/123/decline';

      await signedPost(url);

      expect(mockRequestSigner.sign).toHaveBeenCalledWith('POST', url, undefined, 1234567890000);
      expect(mockHttpClient.post).toHaveBeenCalledWith(url, undefined, {
        headers: {
          'X-Request-Signature': 'test-signature-12345',
          'X-Request-Timestamp': '1234567890000',
        },
      });
    });

    it('should return response data', async () => {
      mockRequestSigner.isEnabled.mockReturnValue(true);
      mockRequestSigner.sign.mockReturnValue('test-signature-12345');
      const mockResponse = { match: { id: '123', status: 'accepted' } };
      mockHttpClient.post.mockResolvedValue(mockResponse);

      const url = '/matchmaking/123/accept';
      const data = { matchId: '123' };

      const result = await signedPost(url, data);

      expect(result).toEqual(mockResponse);
    });
  });

  describe('signedPut', () => {
    it('should add signature headers when signing is enabled', async () => {
      mockRequestSigner.isEnabled.mockReturnValue(true);
      mockRequestSigner.sign.mockReturnValue('test-signature-12345');
      mockHttpClient.put.mockResolvedValue({ success: true });

      const url = '/profile/update';
      const data = { username: 'newname' };

      await signedPut(url, data);

      expect(mockRequestSigner.sign).toHaveBeenCalledWith('PUT', url, data, 1234567890000);
      expect(mockHttpClient.put).toHaveBeenCalledWith(url, data, {
        headers: {
          'X-Request-Signature': 'test-signature-12345',
          'X-Request-Timestamp': '1234567890000',
        },
      });
    });

    it('should not add signature headers when signing is disabled', async () => {
      mockRequestSigner.isEnabled.mockReturnValue(false);
      mockHttpClient.put.mockResolvedValue({ success: true });

      const url = '/profile/update';
      const data = { username: 'newname' };

      await signedPut(url, data);

      expect(mockRequestSigner.sign).not.toHaveBeenCalled();
      expect(mockHttpClient.put).toHaveBeenCalledWith(url, data, undefined);
    });
  });

  describe('signedDelete', () => {
    it('should add signature headers when signing is enabled', async () => {
      mockRequestSigner.isEnabled.mockReturnValue(true);
      mockRequestSigner.sign.mockReturnValue('test-signature-12345');
      mockHttpClient.delete.mockResolvedValue({ success: true });

      const url = '/game/room123/leave';

      await signedDelete(url);

      expect(mockRequestSigner.sign).toHaveBeenCalledWith('DELETE', url, null, 1234567890000);
      expect(mockHttpClient.delete).toHaveBeenCalledWith(url, {
        headers: {
          'X-Request-Signature': 'test-signature-12345',
          'X-Request-Timestamp': '1234567890000',
        },
      });
    });

    it('should not add signature headers when signing is disabled', async () => {
      mockRequestSigner.isEnabled.mockReturnValue(false);
      mockHttpClient.delete.mockResolvedValue({ success: true });

      const url = '/game/room123/leave';

      await signedDelete(url);

      expect(mockRequestSigner.sign).not.toHaveBeenCalled();
      expect(mockHttpClient.delete).toHaveBeenCalledWith(url, undefined);
    });

    it('should merge custom config with signature headers', async () => {
      mockRequestSigner.isEnabled.mockReturnValue(true);
      mockRequestSigner.sign.mockReturnValue('test-signature-12345');
      mockHttpClient.delete.mockResolvedValue({ success: true });

      const url = '/game/room123/leave';
      const config = {
        headers: {
          'X-Custom-Header': 'custom-value',
        },
      };

      await signedDelete(url, config);

      expect(mockHttpClient.delete).toHaveBeenCalledWith(url, {
        headers: {
          'X-Custom-Header': 'custom-value',
          'X-Request-Signature': 'test-signature-12345',
          'X-Request-Timestamp': '1234567890000',
        },
      });
    });
  });

  describe('timestamp generation', () => {
    it('should use current timestamp for each request', async () => {
      mockRequestSigner.isEnabled.mockReturnValue(true);
      mockRequestSigner.sign.mockReturnValue('test-signature');
      mockHttpClient.post.mockResolvedValue({ success: true });

      const url = '/matchmaking/123/accept';
      const data = { matchId: '123' };

      // First request
      await signedPost(url, data);
      expect(mockRequestSigner.sign).toHaveBeenCalledWith('POST', url, data, 1234567890000);

      // Change timestamp
      jest.spyOn(Date, 'now').mockReturnValue(1234567891000);

      // Second request
      await signedPost(url, data);
      expect(mockRequestSigner.sign).toHaveBeenCalledWith('POST', url, data, 1234567891000);
    });
  });
});
