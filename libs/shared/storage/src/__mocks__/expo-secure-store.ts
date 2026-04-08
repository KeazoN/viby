// Manual mock for expo-secure-store
const mockStorage = new Map<string, string>();

export const setItemAsync = jest.fn(async (key: string, value: string) => {
  mockStorage.set(key, value);
});

export const getItemAsync = jest.fn(async (key: string): Promise<string | null> => {
  return mockStorage.get(key) || null;
});

export const deleteItemAsync = jest.fn(async (key: string) => {
  mockStorage.delete(key);
});
