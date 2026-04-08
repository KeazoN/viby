import * as SecureStore from 'expo-secure-store';

/**
 * SecureStorage class for storing sensitive data using platform-specific secure storage
 * Uses iOS Keychain and Android Keystore
 */
export class SecureStorage {
  /**
   * Store a value securely
   */
  async setItem(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value);
  }

  /**
   * Retrieve a value from secure storage
   */
  async getItem(key: string): Promise<string | null> {
    return await SecureStore.getItemAsync(key);
  }

  /**
   * Remove a value from secure storage
   */
  async deleteItem(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  }

  /**
   * Check if a key exists in secure storage
   */
  async hasItem(key: string): Promise<boolean> {
    const value = await this.getItem(key);
    return value !== null;
  }
}

export const secureStorage = new SecureStorage();
