// Storage types

export interface StorageOptions {
  id?: string;
  encryptionKey?: string;
}

export interface SecureStorageItem {
  key: string;
  value: string;
}
