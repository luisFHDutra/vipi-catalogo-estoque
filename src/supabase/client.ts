export const SUPABASE_URL = "";       // ex.: "https://abcxyz.supabase.co"
export const SUPABASE_ANON_KEY = "";  // ex.: "eyJhbGciOiJI..."

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

let _client: any = null;

export async function getSupabase() {
    if (!isSupabaseConfigured) return null;
    if (_client) return _client;
    // @ts-ignore  — TS não resolve tipos de URL remota; em runtime no browser funciona
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return _client;
}