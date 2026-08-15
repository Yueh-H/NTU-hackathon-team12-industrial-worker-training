import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function supabaseConfig(): { url: string; anonKey: string } | null {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey || url.includes("YOUR_PROJECT") || anonKey.includes("YOUR_ANON")) {
    return null;
  }
  return { url, anonKey };
}

let cached: SupabaseClient | null | undefined;

export function getSupabase(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  const config = supabaseConfig();
  cached = config ? createClient(config.url, config.anonKey) : null;
  return cached;
}

export function isCloudEnabled(): boolean {
  return getSupabase() !== null;
}
