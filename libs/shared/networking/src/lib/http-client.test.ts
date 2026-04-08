import { HttpClient } from './http-client';
import { storageService } from '@viby/shared/storage';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock storage service
jest.mock('@viby/shared/storage', () => ({
  storageService: {
    getAccessToken: jest.fn(),
    getRefreshToken: jest.fn(),
    setAccessToken: jest.fn(),
    clearTokens: jest.fn(),
  },
}));

describe('HttpClient', () => {
  let httpClient: HttpClient;
  let mockAxiosInstance: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock axios instance
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: {
          use: jest.fn(),
        },
        response: {
          use: jest.fn(),
        },
      },
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

    // Create HTTP client instance
    httpClient = new HttpClient({
      baseURL: 'http://test-api.com',
      timeout: 5000,
      maxRetries: 2,
      enableLogging: false,
    });
  });

  describe('constructor', () => {
    it('should create axios instance with correct config', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'http://test-api.com',
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('should setup request and response interceptors', () => {
      // 2 request interceptors (logging + auth)
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalledTimes(
        2
      );
      // 3 response interceptors (logging + token refresh + retry)
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalledTimes(
        3
      );
    });

    it('should use default config when not provided', () => {
      jest.clearAllMocks();
      mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

      new HttpClient();

      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'http://localhost:3000',
          timeout: 10000,
        })
      );
    });
  });

  describe('HTTP methods', () => {
    it('should make GET request and return data', async () => {
      const mockData = { id: 1, name: 'Test' };
      mockAxiosInstance.get.mockResolvedValue({ data: mockData });

      const result = await httpClient.get('/users/1');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/users/1', undefined);
      expect(result).toEqual(mockData);
    });

    it('should make POST request and return data', async () => {
      const mockData = { id: 1, name: 'Test' };
      const postData = { name: 'Test' };
      mockAxiosInstance.post.mockResolvedValue({ data: mockData });

      const result = await httpClient.post('/users', postData);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/users',
        postData,
        undefined
      );
      expect(result).toEqual(mockData);
    });

    it('should make PUT request and return data', async () => {
      const mockData = { id: 1, name: 'Updated' };
      const putData = { name: 'Updated' };
      mockAxiosInstance.put.mockResolvedValue({ data: mockData });

      const result = await httpClient.put('/users/1', putData);

      expect(mockAxiosInstance.put).toHaveBeenCalledWith(
        '/users/1',
        putData,
        undefined
      );
      expect(result).toEqual(mockData);
    });

    it('should make PATCH request and return data', async () => {
      const mockData = { id: 1, name: 'Patched' };
      const patchData = { name: 'Patched' };
      mockAxiosInstance.patch.mockResolvedValue({ data: mockData });

      const result = await httpClient.patch('/users/1', patchData);

      expect(mockAxiosInstance.patch).toHaveBeenCalledWith(
        '/users/1',
        patchData,
        undefined
      );
      expect(result).toEqual(mockData);
    });

    it('should make DELETE request and return data', async () => {
      const mockData = { success: true };
      mockAxiosInstance.delete.mockResolvedValue({ data: mockData });

      const result = await httpClient.delete('/users/1');

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith(
        '/users/1',
        undefined
      );
      expect(result).toEqual(mockData);
    });

    it('should pass config to HTTP methods', async () => {
      const mockData = { id: 1 };
      const config = { headers: { 'X-Custom': 'value' } };
      mockAxiosInstance.get.mockResolvedValue({ data: mockData });

      await httpClient.get('/users/1', config);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/users/1', config);
    });
  });

  describe('getAxiosInstance', () => {
    it('should return the underlying axios instance', () => {
      const instance = httpClient.getAxiosInstance();
      expect(instance).toBe(mockAxiosInstance);
    });
  });
});
