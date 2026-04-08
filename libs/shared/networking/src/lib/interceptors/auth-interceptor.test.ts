import { authRequestInterceptor } from './auth-interceptor';
import { storageService } from '@viby/shared/storage';
import type { InternalAxiosRequestConfig } from 'axios';

jest.mock('@viby/shared/storage', () => ({
  storageService: {
    getAccessToken: jest.fn(),
  },
}));

describe('authRequestInterceptor', () => {
  let mockConfig: InternalAxiosRequestConfig;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConfig = {
      headers: {},
    } as InternalAxiosRequestConfig;
  });

  it('should inject access token when available', async () => {
    const mockToken = 'test-access-token';
    (storageService.getAccessToken as jest.Mock).mockResolvedValue(mockToken);

    const result = await authRequestInterceptor(mockConfig);

    expect(storageService.getAccessToken).toHaveBeenCalled();
    expect(result.headers.Authorization).toBe(`Bearer ${mockToken}`);
  });

  it('should not inject token when not available', async () => {
    (storageService.getAccessToken as jest.Mock).mockResolvedValue(null);

    const result = await authRequestInterceptor(mockConfig);

    expect(storageService.getAccessToken).toHaveBeenCalled();
    expect(result.headers.Authorization).toBeUndefined();
  });

  it('should return config unchanged when no token', async () => {
    (storageService.getAccessToken as jest.Mock).mockResolvedValue(null);

    const result = await authRequestInterceptor(mockConfig);

    expect(result).toBe(mockConfig);
  });
});
