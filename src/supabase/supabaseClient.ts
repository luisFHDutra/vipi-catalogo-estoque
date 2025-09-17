// @ts-ignore porque o import real é do CDN
import { createClient, type AuthChangeEvent, type Session } from "@supabase/supabase-js";

// mas o supabase real vem do CDN
// @ts-ignore
import { createClient as createClientCDN } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://qatqlqbrhchmilprmtja.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhdHFscWJyaGNobWlscHJtdGphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNDgzNDksImV4cCI6MjA3MzYyNDM0OX0.A2Bfu8150c1EZOl7skQMBFd0r9ikDtWbxLqcG-NRAzM";

// cria e exporta
export const supabase = createClientCDN(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
});
