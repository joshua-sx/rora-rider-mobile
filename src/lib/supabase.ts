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
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || 
  process.env.EXPO_PUBLIC_SUPABASE_URL || 
  'http://127.0.0.1:54321';

const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || 
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
  '';

if (!supabaseAnonKey) {
  console.warn(
    '⚠️  EXPO_PUBLIC_SUPABASE_ANON_KEY is not set. ' +
    'Run `npx supabase start` and copy the anon key to .env.local'
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
    const { data, error } = await supabase.from('_prisma_migrations').select('count').limit(1);
    // If we get here without error, connection works
    // (even if the table doesn't exist, we'll get a different error)
    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "relation does not exist" which is fine for a test
      console.error('Supabase connection error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase connection test failed:', err);
    return false;
  }
}

