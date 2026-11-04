import { createClient } from '@supabase/supabase-js';

// Environment variables for Supabase
const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check local storage override if configured dynamically via Setup Guide
const storedUrl = typeof window !== 'undefined' ? localStorage.getItem('simpkl_supabase_url') : null;
const storedAnonKey = typeof window !== 'undefined' ? localStorage.getItem('simpkl_supabase_anon_key') : null;

export const supabaseUrl = envUrl || storedUrl || '';
export const supabaseAnonKey = envAnonKey || storedAnonKey || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  supabaseUrl.includes('.supabase.co')
);

// Instantiate Supabase client safely
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

/**
 * Update stored Supabase connection credentials
 */
export function setSupabaseConfig(url: string, anonKey: string) {
  if (url && anonKey) {
    localStorage.setItem('simpkl_supabase_url', url.trim());
    localStorage.setItem('simpkl_supabase_anon_key', anonKey.trim());
    window.location.reload();
  }
}

/**
 * Clear stored Supabase connection credentials
 */
export function clearSupabaseConfig() {
  localStorage.removeItem('simpkl_supabase_url');
  localStorage.removeItem('simpkl_supabase_anon_key');
  window.location.reload();
}
