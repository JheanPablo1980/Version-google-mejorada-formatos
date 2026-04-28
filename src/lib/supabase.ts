import { createClient } from '@supabase/supabase-js';

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Sanitización automática de la URL
if (supabaseUrl && supabaseUrl.startsWith('http')) {
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

if (!supabaseUrl || !supabaseUrl.startsWith('http') || !supabaseAnonKey) {
  console.warn('Configuración de Supabase incompleta o inválida. Revisa el panel de Secrets.');
}

// Inicialización segura para evitar colapso del módulo si las variables faltan o son inválidas
export const supabase = createClient(
  supabaseUrl && supabaseUrl.startsWith('http') ? supabaseUrl : 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);
