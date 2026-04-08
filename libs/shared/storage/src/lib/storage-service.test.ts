import { StorageService } from './storage-service';
import { secureStorage } from './secure-storage';

// Mock MMKV
jest.mock('react-native-mmkv', () => {
  const mockStorage = new Map<string, any>();
  
  return {
    MMKV: jest.fn().mockImplementation(() => ({
      set: jest.fn((key: string, value: any) => {
        mockStorage.set(key, value);
      }),
      getString: jest.fn((key: string) => {
        const value = mockStorage.get(key);
        return typeof value === 'string' ? value : undefined;
      }),
      getNumber: jest.fn((key: string) => {
        const value = mockStorage.get(key);
        return typeof value === 'number' ? value : undefined;
      }),
      getBoolean: jest.fn((key: string) => {
        const value = mockStorage.get(key);
        return typeof value === 'boolean' ? value : undefined;
      }),
      delete: jest.fn((key: string) => {
        mockStorage.delete(key);
      }),
      contains: jest.fn((key: string) => {
        return mockStorage.has(key);
      }),
      getAllKeys: jest.fn(() => {
        return Array.from(mockStorage.keys());
      }),
      clearAll: jest.fn(() => {
        mockStorage.clear();
      }),
    })),
  };
});

// Mock SecureStore
jest.mock('./secure-storage', () => {
  const mockSecureStorage = new Map<string, string>();
  
  return {
    secureStorage: {
      setItem: jest.fn(async (key: string, value: string) => {
        mockSecureStorage.set(key, value);
      }),
      getItem: jest.fn(async (key: string) => {
        return mockSecureStorage.get(key) || null;
      }),
      deleteItem: jest.fn(async (key: string) => {
        mockSecureStorage.delete(key);
      }),
      hasItem: jest.fn(async (key: string) => {
        return mockSecureStorage.has(key);
      }),
    },
  };
});

describe('StorageService', () => {
  let storageService: StorageService;

  beforeEach(() => {
    storageService = new StorageService();
    jest.clearAllMocks();
  });

  describe('Secure Token Storage', () => {
    it('should store and retrieve access token', async () => {
      const token = 'test-access-token';
      
      await storageService.setAccessToken(token);
      const retrieved = await storageService.getAccessToken();
      
      expect(secureStorage.setItem).toHaveBeenCalledWith('access_token', token);
      expect(retrieved).toBe(token);
    });

    it('should store and retrieve refresh token', async () => {
      const token = 'test-refresh-token';
      
      await storageService.setRefreshToken(token);
      const retrieved = await storageService.getRefreshToken();
      
      expect(secureStorage.setItem).toHaveBeenCalledWith('refresh_token', token);
      expect(retrieved).toBe(token);
    });

    it('should clear all tokens', async () => {
      await storageService.setAccessToken('access');
      await storageService.setRefreshToken('refresh');
      
      await storageService.clearTokens();
      
      expect(secureStorage.deleteItem).toHaveBeenCalledWith('access_token');
      expect(secureStorage.deleteItem).toHaveBeenCalledWith('refresh_token');
    });
  });

  describe('Fast Storage (MMKV)', () => {
    it('should store and retrieve string values', () => {
      storageService.set('test-key', 'test-value');
      const retrieved = storageService.get('test-key');
      
      expect(retrieved).toBe('test-value');
    });

    it('should store and retrieve number values', () => {
      storageService.setNumber('count', 42);
      const retrieved = storageService.getNumber('count');
      
      expect(retrieved).toBe(42);
    });

    it('should store and retrieve boolean values', () => {
      storageService.setBoolean('flag', true);
      const retrieved = storageService.getBoolean('flag');
      
      expect(retrieved).toBe(true);
    });

    it('should store and retrieve objects', () => {
      const obj = { name: 'test', value: 123 };
      
      storageService.setObject('obj-key', obj);
      const retrieved = storageService.getObject('obj-key');
      
      expect(retrieved).toEqual(obj);
    });

    it('should return undefined for non-existent keys', () => {
      const retrieved = storageService.get('non-existent');
      
      expect(retrieved).toBeUndefined();
    });

    it('should delete values', () => {
      storageService.set('to-delete', 'value');
      storageService.delete('to-delete');
      
      const retrieved = storageService.get('to-delete');
      expect(retrieved).toBeUndefined();
    });

    it('should check if key exists', () => {
      storageService.set('exists', 'value');
      
      expect(storageService.contains('exists')).toBe(true);
      expect(storageService.contains('not-exists')).toBe(false);
    });

    it('should get all keys', () => {
      storageService.set('key1', 'value1');
      storageService.set('key2', 'value2');
      
      const keys = storageService.getAllKeys();
      
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
    });

    it('should clear all non-secure storage', () => {
      storageService.set('key1', 'value1');
      storageService.set('key2', 'value2');
      
      storageService.clearAll();
      
      expect(storageService.get('key1')).toBeUndefined();
      expect(storageService.get('key2')).toBeUndefined();
    });

    it('should handle invalid JSON when retrieving objects', () => {
      // Manually set invalid JSON
      storageService.set('invalid-json', '{invalid}');
      
      const retrieved = storageService.getObject('invalid-json');
      
      expect(retrieved).toBeUndefined();
    });
  });

  describe('Clear All Including Tokens', () => {
    it('should clear both MMKV storage and secure tokens', async () => {
      // Set up some data
      storageService.set('key', 'value');
      await storageService.setAccessToken('token');
      
      await storageService.clearAllIncludingTokens();
      
      expect(storageService.get('key')).toBeUndefined();
      expect(secureStorage.deleteItem).toHaveBeenCalledWith('access_token');
      expect(secureStorage.deleteItem).toHaveBeenCalledWith('refresh_token');
    });
  });
});
