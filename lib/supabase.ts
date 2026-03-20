import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;
let _initFailed = false;

export function getSupabase(): SupabaseClient | null {
  if (_initFailed) return null;
  if (_supabase) return _supabase;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!url || !key) return null;

  try {
    _supabase = createClient(url, key);
  } catch (e) {
    console.error('[ChiChiFolio] Supabase init failed:', e);
    _initFailed = true;
    return null;
  }
  return _supabase;
}
