import * as SecureStore from "expo-secure-store";

const memoryStore = new Map<string, string>();

function useMemoryFallback(): boolean {
  return process.env.JEST_WORKER_ID !== undefined || process.env.NODE_ENV === "test";
}

export async function getSecureItem(key: string): Promise<string | null> {
  if (useMemoryFallback()) {
    return memoryStore.get(key) ?? null;
  }
  try {
    const available = await SecureStore.isAvailableAsync();
    if (!available) {
      return memoryStore.get(key) ?? null;
    }
    return await SecureStore.getItemAsync(key);
  } catch {
    return memoryStore.get(key) ?? null;
  }
}

export async function setSecureItem(key: string, value: string): Promise<void> {
  if (useMemoryFallback()) {
    memoryStore.set(key, value);
    return;
  }
  try {
    const available = await SecureStore.isAvailableAsync();
    if (!available) {
      memoryStore.set(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  } catch {
    memoryStore.set(key, value);
  }
}

export async function deleteSecureItem(key: string): Promise<void> {
  memoryStore.delete(key);
  if (useMemoryFallback()) {
    return;
  }
  try {
    const available = await SecureStore.isAvailableAsync();
    if (available) {
      await SecureStore.deleteItemAsync(key);
    }
  } catch {
    // Memory copy already cleared.
  }
}

export function resetMemoryStore(): void {
  memoryStore.clear();
}
