
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export const getDetectedConfig = () => {
  // 1. Check process.env (Node/Vercel/Webpack)
  const env = (typeof process !== 'undefined' && process.env) ? process.env : {};
  
  // 2. Check import.meta.env (Vite/Modern ESM)
  // @ts-ignore
  const metaEnv = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};

  // 3. Check global window/globalThis (Direct injection or Sandbox globals)
  const g = (typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : {})) as any;
  const winEnv = g.process?.env || g._env_ || g.env || g.CONFIG || {};

  const find = (key: string) => {
    return env[key] || metaEnv[key] || winEnv[key] || 
           env[`VITE_${key}`] || metaEnv[`VITE_${key}`] || 
           env[`NEXT_PUBLIC_${key}`] || metaEnv[`NEXT_PUBLIC_${key}`] || 
           sessionStorage.getItem(`manual_${key.toLowerCase()}`);
  };

  return {
    url: find('SUPABASE_URL') || '',
    key: find('SUPABASE_ANON_KEY') || ''
  };
};

export const isSupabaseConfigured = () => {
  const { url, key } = getDetectedConfig();
  return !!(url && key && url.startsWith('http'));
};

export const configureSupabase = (url: string, key: string) => {
  if (!url || !key) return null;
  sessionStorage.setItem('manual_supabase_url', url);
  sessionStorage.setItem('manual_supabase_key', key);
  client = createClient(url, key);
  return client;
};

export const getSupabase = () => {
  if (client) return client;
  const { url, key } = getDetectedConfig();
  if (url && key) {
    client = createClient(url, key);
    return client;
  }
  return null as any;
};

export const supabase = getSupabase();
