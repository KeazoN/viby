import { MMKV } from 'react-native-mmkv';
import { secureStorage } from './secure-storage';
import type { StorageOptions } from './types';

/**
 * StorageService provides a unified interface for both secure token storage
 * and fast key-value storage for non-sensitive data.
 * 
 * - Secure tokens (JWT) are stored using Expo SecureStore (platform keychain)
 * - Non-sensitive data is stored using MMKV for fast synchronous access
 */
export class StorageService {
  private storage: MMKV;

  constructor(options: StorageOptions = {}) {
    this.storage = new MMKV({
      id: options.id || 'viby-storage',
      // In production, use device-specific encryption key
      encryptionKey: options.encryptionKey || 'viby-encryption-key',
    });
  }

  // ============================================
  // Secure Token Storage (uses platform keychain)
  // ============================================

  /**
   * Store access token securely in platform keychain
   */
  async setAccessToken(token: string): Promise<void> {
    await secureStorage.setItem('access_token', token);
  }

  /**
   * Retrieve access token from platform keychain
   */
  async getAccessToken(): Promise<string | null> {
    return await secureStorage.getItem('access_token');
  }

  /**
   * Store refresh token securely in platform keychain
   */
  async setRefreshToken(token: string): Promise<void> {
    await secureStorage.setItem('refresh_token', token);
  }

  /**
   * Retrieve refresh token from platform keychain
   */
  async getRefreshToken(): Promise<string | null> {
    return await secureStorage.getItem('refresh_token');
  }

  /**
   * Clear all stored tokens from platform keychain
   */
  async clearTokens(): Promise<void> {
    await secureStorage.deleteItem('access_token');
    await secureStorage.deleteItem('refresh_token');
  }

  // ============================================
  // Fast Storage for Non-Sensitive Data (MMKV)
  // ============================================

  /**
   * Store a string value
   */
  set(key: string, value: string): void {
    this.storage.set(key, value);
  }

  /**
   * Retrieve a string value
   */
  get(key: string): string | undefined {
    return this.storage.getString(key);
  }

  /**
   * Store a number value
   */
  setNumber(key: string, value: number): void {
    this.storage.set(key, value);
  }

  /**
   * Retrieve a number value
   */
  getNumber(key: string): number | undefined {
    return this.storage.getNumber(key);
  }

  /**
   * Store a boolean value
   */
  setBoolean(key: string, value: boolean): void {
    this.storage.set(key, value);
  }

  /**
   * Retrieve a boolean value
   */
  getBoolean(key: string): boolean | undefined {
    return this.storage.getBoolean(key);
  }

  /**
   * Store an object as JSON
   */
  setObject<T>(key: string, value: T): void {
    this.storage.set(key, JSON.stringify(value));
  }

  /**
   * Retrieve an object from JSON
   */
  getObject<T>(key: string): T | undefined {
    const value = this.storage.getString(key);
    if (!value) return undefined;
    
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Failed to parse object for key "${key}":`, error);
      return undefined;
    }
  }

  /**
   * Delete a value
   */
  delete(key: string): void {
    this.storage.delete(key);
  }

  /**
   * Check if a key exists
   */
  contains(key: string): boolean {
    return this.storage.contains(key);
  }

  /**
   * Get all keys
   */
  getAllKeys(): string[] {
    return this.storage.getAllKeys();
  }

  /**
   * Clear all non-secure storage
   */
  clearAll(): void {
    this.storage.clearAll();
  }

  /**
   * Clear all storage including secure tokens
   */
  async clearAllIncludingTokens(): Promise<void> {
    this.clearAll();
    await this.clearTokens();
  }
}

// Export singleton instance
export const storageService = new StorageService();
