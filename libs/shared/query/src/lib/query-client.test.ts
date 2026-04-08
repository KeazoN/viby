import { queryClient, queryPersister } from './query-client';
import { storageService } from '@viby/shared/storage';

// Mock the storage service
jest.mock('@viby/shared/storage', () => ({
  storageService: {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('QueryClient Configuration', () => {
  describe('queryClient', () => {
    it('should be defined', () => {
      expect(queryClient).toBeDefined();
    });

    it('should have correct default query options', () => {
      const defaultOptions = queryClient.getDefaultOptions();

      expect(defaultOptions.queries?.staleTime).toBe(1000 * 60 * 5); // 5 minutes
      expect(defaultOptions.queries?.gcTime).toBe(1000 * 60 * 30); // 30 minutes
      expect(defaultOptions.queries?.retry).toBe(3);
      expect(defaultOptions.queries?.refetchOnWindowFocus).toBe(true);
      expect(defaultOptions.queries?.refetchOnReconnect).toBe(true);
      expect(defaultOptions.queries?.refetchOnMount).toBe(true);
    });

    it('should have correct default mutation options', () => {
      const defaultOptions = queryClient.getDefaultOptions();

      expect(defaultOptions.mutations?.retry).toBe(1);
      expect(defaultOptions.mutations?.retryDelay).toBe(0);
    });

    it('should use exponential backoff for retry delay', () => {
      const defaultOptions = queryClient.getDefaultOptions();
      const retryDelay = defaultOptions.queries?.retryDelay as (attemptIndex: number) => number;

      expect(retryDelay).toBeDefined();
      expect(retryDelay(0)).toBe(1000); // 1s
      expect(retryDelay(1)).toBe(2000); // 2s
      expect(retryDelay(2)).toBe(4000); // 4s
      expect(retryDelay(3)).toBe(8000); // 8s
      expect(retryDelay(4)).toBe(16000); // 16s
      expect(retryDelay(5)).toBe(30000); // Max 30s
      expect(retryDelay(10)).toBe(30000); // Still max 30s
    });
  });

  describe('queryPersister', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should be defined', () => {
      expect(queryPersister).toBeDefined();
    });

    it('should use storageService for getItem', () => {
      const mockValue = 'test-value';
      (storageService.get as jest.Mock).mockReturnValue(mockValue);

      // Access the storage object from persister
      const storage = (queryPersister as any).storage;
      const result = storage.getItem('test-key');

      expect(storageService.get).toHaveBeenCalledWith('test-key');
      expect(result).toBe(mockValue);
    });

    it('should return null when storageService returns undefined', () => {
      (storageService.get as jest.Mock).mockReturnValue(undefined);

      const storage = (queryPersister as any).storage;
      const result = storage.getItem('test-key');

      expect(result).toBeNull();
    });

    it('should use storageService for setItem', () => {
      const storage = (queryPersister as any).storage;
      storage.setItem('test-key', 'test-value');

      expect(storageService.set).toHaveBeenCalledWith('test-key', 'test-value');
    });

    it('should use storageService for removeItem', () => {
      const storage = (queryPersister as any).storage;
      storage.removeItem('test-key');

      expect(storageService.delete).toHaveBeenCalledWith('test-key');
    });
  });
});
