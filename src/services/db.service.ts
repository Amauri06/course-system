import type { StorageAdapter } from '../adapters/storage.interface';
import { localStorageAdapter } from '../adapters/localStorage.adapter';
import { supabaseAdapter } from '../adapters/supabase.adapter';

type AdapterType = 'localStorage' | 'supabase';

class DbService {
  private adapter: StorageAdapter;
  private currentType: AdapterType = 'localStorage';

  constructor() {
    this.adapter = localStorageAdapter;
  }

  /**
   * Cambia dinámicamente el adaptador de datos
   */
  setAdapter(type: AdapterType) {
    this.currentType = type;
    if (type === 'localStorage') {
      this.adapter = localStorageAdapter;
    } else if (type === 'supabase') {
      this.adapter = supabaseAdapter;
    }
    console.log(`[DbService] Cambiado al adaptador de persistencia: ${type}`);
  }

  getCurrentAdapterType(): AdapterType {
    return this.currentType;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.adapter.getItem(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      console.error(`[DbService] Error leyendo la clave "${key}":`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await this.adapter.setItem(key, serialized);
    } catch (error) {
      console.error(`[DbService] Error guardando la clave "${key}":`, error);
    }
  }

  async remove(key: string): Promise<void> {
    try {
      await this.adapter.removeItem(key);
    } catch (error) {
      console.error(`[DbService] Error eliminando la clave "${key}":`, error);
    }
  }

  /**
   * Genera una interfaz compatible con Zustand persist middleware (StateStorage)
   */
  getZustandStorage() {
    return {
      getItem: async (name: string): Promise<string | null> => {
        const item = await this.adapter.getItem(name);
        return item;
      },
      setItem: async (name: string, value: string): Promise<void> => {
        await this.adapter.setItem(name, value);
      },
      removeItem: async (name: string): Promise<void> => {
        await this.adapter.removeItem(name);
      }
    };
  }
}

export const dbService = new DbService();
export default dbService;
