
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export const getDetectedConfig = () => {
  const env = (typeof process !== 'undefined' && process.env) ? process.env : {};
  // @ts-ignore
  const metaEnv = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};
  const win = (typeof window !== 'undefined') ? (window as any) : {};
  const winEnv = win.process?.env || win._env_ || win.env || {};

  const find = (key: string) => {
    return env[`VITE_${key}`] || metaEnv[`VITE_${key}`] || winEnv[`VITE_${key}`] ||
           env[key] || metaEnv[key] || winEnv[key] ||
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
