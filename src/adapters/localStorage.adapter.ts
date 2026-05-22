import type { StorageAdapter } from './storage.interface';

export class LocalStorageAdapter implements StorageAdapter {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('[LocalStorageAdapter] Error leyendo de localStorage', error);
      return null;
    }
  }

  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('[LocalStorageAdapter] Error escribiendo en localStorage', error);
    }
  }

  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('[LocalStorageAdapter] Error eliminando de localStorage', error);
    }
  }
}

export const localStorageAdapter = new LocalStorageAdapter();
