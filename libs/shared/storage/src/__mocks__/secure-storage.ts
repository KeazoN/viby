// Manual mock for secure-storage
const mockSecureStorage = new Map<string, string>();

export class SecureStorage {
  async setItem(key: string, value: string): Promise<void> {
    mockSecureStorage.set(key, value);
  }

  async getItem(key: string): Promise<string | null> {
    const value = mockSecureStorage.get(key);
    return value !== undefined ? value : null;
  }

  async deleteItem(key: string): Promise<void> {
    mockSecureStorage.delete(key);
  }

  async hasItem(key: string): Promise<boolean> {
    return mockSecureStorage.has(key);
  }
}

export const secureStorage = new SecureStorage();
