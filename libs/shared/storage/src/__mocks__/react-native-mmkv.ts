// Manual mock for react-native-mmkv
const mockStorage = new Map<string, any>();

export class MMKV {
  constructor(options?: { id?: string; encryptionKey?: string }) {
    // Mock constructor
  }

  set(key: string, value: any): void {
    mockStorage.set(key, value);
  }

  getString(key: string): string | undefined {
    const value = mockStorage.get(key);
    return typeof value === 'string' ? value : undefined;
  }

  getNumber(key: string): number | undefined {
    const value = mockStorage.get(key);
    return typeof value === 'number' ? value : undefined;
  }

  getBoolean(key: string): boolean | undefined {
    const value = mockStorage.get(key);
    return typeof value === 'boolean' ? value : undefined;
  }

  delete(key: string): void {
    mockStorage.delete(key);
  }

  contains(key: string): boolean {
    return mockStorage.has(key);
  }

  getAllKeys(): string[] {
    return Array.from(mockStorage.keys());
  }

  clearAll(): void {
    mockStorage.clear();
  }
}
