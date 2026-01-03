import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

/**
 * Supabase client for Rora Ride
 * 
 * Uses environment variables for configuration:
 * - EXPO_PUBLIC_SUPABASE_URL: Supabase project URL
 * - EXPO_PUBLIC_SUPABASE_ANON_KEY: Supabase anonymous key
 * 
 * For local development:
 * - Run `npx supabase start` to start local Supabase
 * - Default local URL: http://127.0.0.1:54321
 * - Get the anon key from `npx supabase status`
 */
const defaultSupabaseUrl = 'http://127.0.0.1:54321';
const supabaseUrl =
  Constants.expoConfig?.extra?.supabaseUrl ||
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  defaultSupabaseUrl;

const supabaseAnonKey =
  Constants.expoConfig?.extra?.supabaseAnonKey ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  '';

if (supabaseUrl === defaultSupabaseUrl && !process.env.EXPO_PUBLIC_SUPABASE_URL) {
  console.warn(
    '⚠️  EXPO_PUBLIC_SUPABASE_URL is not set. ' +
      'Defaulting to the local Supabase URL (http://127.0.0.1:54321).'
  );
}

if (!supabaseAnonKey) {
  console.warn(
    '⚠️  EXPO_PUBLIC_SUPABASE_ANON_KEY is not set. ' +
      'Run `npx supabase start` and copy the anon key to .env.local.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

/**
 * Test connection to Supabase
 * @returns Promise<boolean> - true if connection successful
 */
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('version');

    if (error) {
      const { error: fallbackError } = await supabase
        .from('_prisma_migrations')
        .select('count')
        .limit(1);

      if (fallbackError && fallbackError.code !== 'PGRST116') {
        console.error('Supabase connection error:', fallbackError);
        return false;
      }
    }

    return true;
  } catch (err) {
    console.error('Supabase connection test failed:', err);
    return false;
  }
}
