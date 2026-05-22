import type { StorageAdapter } from './storage.interface';

/**
 * SupabaseAdapter (Estructura para Futura Migración)
 * 
 * Esta clase sirve como una guía clara e interfaz implementada para cuando
 * se decida migrar de LocalStorage a Supabase en el futuro.
 * 
 * Para la migración real en el futuro:
 * 1. Instalar la librería: npm install @supabase/supabase-js
 * 2. Crear un archivo `src/lib/supabaseClient.ts`
 * 3. Reemplazar la lógica de abajo por llamadas reales como `supabase.from('...')`
 */
export class SupabaseAdapter implements StorageAdapter {
  // Simulación de delay de red para emular el comportamiento real asíncrono
  private async delay(ms = 150): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async getItem(key: string): Promise<string | null> {
    await this.delay();
    
    // EJEMPLO DE CÓDIGO FUTURO:
    // const { data, error } = await supabase
    //   .from('academy_store')
    //   .select('state')
    //   .eq('key', key)
    //   .single();
    // if (error) return null;
    // return data.state;
    
    console.log(`[SupabaseAdapter MOCK] Recuperando estado para: "${key}"`);
    return localStorage.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    await this.delay();
    
    // EJEMPLO DE CÓDIGO FUTURO:
    // const { error } = await supabase
    //   .from('academy_store')
    //   .upsert({ key, state: value });
    
    console.log(`[SupabaseAdapter MOCK] Almacenando estado para: "${key}"`);
    localStorage.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    await this.delay();
    
    // EJEMPLO DE CÓDIGO FUTURO:
    // const { error } = await supabase
    //   .from('academy_store')
    //   .delete()
    //   .eq('key', key);
    
    console.log(`[SupabaseAdapter MOCK] Eliminando estado para: "${key}"`);
    localStorage.removeItem(key);
  }
}

export const supabaseAdapter = new SupabaseAdapter();
