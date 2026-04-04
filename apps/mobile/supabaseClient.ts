// Minimal Supabase client for Expo (mobile-only).
// Uses `EXPO_PUBLIC_*` env vars so Expo can inline them at build time.
import { createClient, type SupabaseClient, type Session } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string | undefined;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string | undefined;

let client: SupabaseClient | null = null;
if (supabaseUrl && supabaseAnonKey) {
  client = createClient(supabaseUrl, supabaseAnonKey);
}

export { client as supabase };
export type { Session };

