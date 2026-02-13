
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

const getInitialConfig = () => {
  // Check process.env (Standard/Vercel)
  const env = (typeof process !== 'undefined' && process.env) ? process.env : {};
  
  // Check import.meta.env (Modern ESM tools)
  // @ts-ignore
  const metaEnv = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};

  // Check global window (Direct injection)
  const win = (typeof window !== 'undefined') ? (window as any) : {};
  const winEnv = win.process?.env || win._env_ || win.env || {};

  // Try all possible names including common prefixes
  const url = 
    env.SUPABASE_URL || metaEnv.SUPABASE_URL || winEnv.SUPABASE_URL ||
    env.VITE_SUPABASE_URL || metaEnv.VITE_SUPABASE_URL ||
    env.NEXT_PUBLIC_SUPABASE_URL || metaEnv.NEXT_PUBLIC_SUPABASE_URL ||
    sessionStorage.getItem('manual_supabase_url') || '';

  const key = 
    env.SUPABASE_ANON_KEY || metaEnv.SUPABASE_ANON_KEY || winEnv.SUPABASE_ANON_KEY ||
    env.VITE_SUPABASE_ANON_KEY || metaEnv.VITE_SUPABASE_ANON_KEY ||
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY || metaEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    sessionStorage.getItem('manual_supabase_key') || '';

  return { url, key };
};

export const isSupabaseConfigured = () => {
  const { url, key } = getInitialConfig();
  return !!(url && key);
};

export const configureSupabase = (url: string, key: string) => {
  if (!url || !key) return null;
  sessionStorage.setItem('manual_supabase_url', url);
  sessionStorage.setItem('manual_supabase_key', key);
  client = createClient(url, key);
  return client;
};

// Singleton getter for the client
export const getSupabase = () => {
  if (client) return client;
  const { url, key } = getInitialConfig();
  if (url && key) {
    client = createClient(url, key);
    return client;
  }
  return null as any;
};

// For backward compatibility and immediate use where safe
export const supabase = getSupabase();
