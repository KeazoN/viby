import { LoggingInterceptor } from './logging-interceptor';
import type {
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from 'axios';

describe('LoggingInterceptor', () => {
  let loggingInterceptor: LoggingInterceptor;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('with logging enabled', () => {
    beforeEach(() => {
      loggingInterceptor = new LoggingInterceptor(true);
    });

    it('should log requests', () => {
      const mockConfig: InternalAxiosRequestConfig = {
        method: 'GET',
        url: '/test',
        baseURL: 'http://api.test.com',
        headers: {} as any,
      };

      loggingInterceptor.logRequest(mockConfig);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[HTTP Request]',
        expect.objectContaining({
          method: 'GET',
          url: 'http://api.test.com/test',
        })
      );
    });

    it('should sanitize authorization header in logs', () => {
      const mockConfig: InternalAxiosRequestConfig = {
        method: 'GET',
        url: '/test',
        baseURL: 'http://api.test.com',
        headers: {
          Authorization: 'Bearer secret-token',
        } as any,
      };

      loggingInterceptor.logRequest(mockConfig);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[HTTP Request]',
        expect.objectContaining({
          headers: {
            Authorization: '[REDACTED]',
          },
        })
      );
    });

    it('should log responses with duration', () => {
      const mockConfig: InternalAxiosRequestConfig = {
        method: 'GET',
        url: '/test',
        baseURL: 'http://api.test.com',
        headers: {} as any,
      };

      const mockResponse: AxiosResponse = {
        config: mockConfig,
        status: 200,
        statusText: 'OK',
        headers: {},
        data: { id: 1 },
      };

      // Log request first to set timestamp
      loggingInterceptor.logRequest(mockConfig);

      // Wait a bit
      jest.advanceTimersByTime(100);

      loggingInterceptor.logResponse(mockResponse);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[HTTP Response]',
        expect.objectContaining({
          method: 'GET',
          url: 'http://api.test.com/test',
          status: 200,
          duration: expect.any(Number),
        })
      );
    });

    it('should log errors with duration', () => {
      const mockConfig: InternalAxiosRequestConfig = {
        method: 'GET',
        url: '/test',
        baseURL: 'http://api.test.com',
        headers: {} as any,
      };

      const mockError: AxiosError = {
        config: mockConfig,
        message: 'Network Error',
        name: 'AxiosError',
        isAxiosError: true,
        toJSON: () => ({}),
      };

      // Log request first to set timestamp
      loggingInterceptor.logRequest(mockConfig);

      loggingInterceptor.logError(mockError);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[HTTP Error]',
        expect.objectContaining({
          method: 'GET',
          url: 'http://api.test.com/test',
          message: 'Network Error',
          duration: expect.any(Number),
        })
      );
    });

    it('should log error without config', () => {
      const mockError: AxiosError = {
        config: undefined,
        message: 'Unknown Error',
        name: 'AxiosError',
        isAxiosError: true,
        toJSON: () => ({}),
      };

      loggingInterceptor.logError(mockError);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[HTTP Error]',
        'Unknown Error'
      );
    });
  });

  describe('with logging disabled', () => {
    beforeEach(() => {
      loggingInterceptor = new LoggingInterceptor(false);
    });

    it('should not log requests', () => {
      const mockConfig: InternalAxiosRequestConfig = {
        method: 'GET',
        url: '/test',
        baseURL: 'http://api.test.com',
        headers: {} as any,
      };

      loggingInterceptor.logRequest(mockConfig);

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should not log responses', () => {
      const mockConfig: InternalAxiosRequestConfig = {
        method: 'GET',
        url: '/test',
        baseURL: 'http://api.test.com',
        headers: {} as any,
      };

      const mockResponse: AxiosResponse = {
        config: mockConfig,
        status: 200,
        statusText: 'OK',
        headers: {},
        data: { id: 1 },
      };

      loggingInterceptor.logResponse(mockResponse);

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should not log errors', () => {
      const mockConfig: InternalAxiosRequestConfig = {
        method: 'GET',
        url: '/test',
        baseURL: 'http://api.test.com',
        headers: {} as any,
      };

      const mockError: AxiosError = {
        config: mockConfig,
        message: 'Network Error',
        name: 'AxiosError',
        isAxiosError: true,
        toJSON: () => ({}),
      };

      loggingInterceptor.logError(mockError);

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });
});
