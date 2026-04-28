import { createClient } from '@supabase/supabase-js';

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Sanitización automática de la URL
if (supabaseUrl) {
  // Eliminar espacios
  supabaseUrl = supabaseUrl.trim();
  // Eliminar barra final si existe
  if (supabaseUrl.endsWith('/')) {
    supabaseUrl = supabaseUrl.slice(0, -1);
  }
  // Si el usuario pegó la URL de PostgREST (/rest/v1), la limpiamos
  if (supabaseUrl.endsWith('/rest/v1')) {
    supabaseUrl = supabaseUrl.replace('/rest/v1', '');
  }
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Configuración de Supabase incompleta. Revisa el panel de Secrets.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
