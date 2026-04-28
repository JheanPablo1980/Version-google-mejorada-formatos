import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseUrl.startsWith('http') && supabaseAnonKey);

// Inicialización segura
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder-invalid.supabase.co', 
  supabaseAnonKey || 'placeholder'
);
