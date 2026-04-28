import { createClient } from '@supabase/supabase-js';

const getSanitizedUrl = (url: string) => {
  if (!url) return '';
  let cleanUrl = url.trim();
  if (cleanUrl.endsWith('/')) {
    cleanUrl = cleanUrl.slice(0, -1);
  }
  return cleanUrl;
};

const supabaseUrl = getSanitizedUrl(import.meta.env.VITE_SUPABASE_URL || '');
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const isSupabaseConfigured = !!(supabaseUrl && supabaseUrl.startsWith('http') && supabaseAnonKey);

// Inicialización segura
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder-invalid.supabase.co', 
  supabaseAnonKey || 'placeholder'
);
