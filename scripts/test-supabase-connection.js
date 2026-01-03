#!/usr/bin/env node

/**
 * Test Supabase connection
 * 
 * Usage:
 *   node scripts/test-supabase-connection.js
 * 
 * Requires:
 *   - Supabase local instance running (`npx supabase start`)
 *   - .env.local with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseAnonKey || supabaseAnonKey === 'your-anon-key-here') {
  console.error('❌ EXPO_PUBLIC_SUPABASE_ANON_KEY is not set in .env.local');
  console.log('\nTo get the anon key:');
  console.log('  1. Run: npx supabase start');
  console.log('  2. Copy the "anon key" from the output');
  console.log('  3. Update .env.local with the key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('🔌 Testing Supabase connection...');
  console.log(`   URL: ${supabaseUrl}`);
  console.log(`   Key: ${supabaseAnonKey.substring(0, 20)}...`);
  console.log('');

  try {
    // Try a simple query - this will work even if no tables exist yet
    const { data, error } = await supabase.rpc('version');

    if (error) {
      // If RPC doesn't exist, try a simple select from a system table
      const { data: data2, error: error2 } = await supabase
        .from('_prisma_migrations')
        .select('count')
        .limit(1);

      if (error2 && error2.code !== 'PGRST116') {
        // PGRST116 = relation does not exist (expected if no migrations yet)
        throw error2;
      }
    }

    console.log('✅ Supabase connection successful!');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Create database migrations: npx supabase migration create <name>');
    console.log('  2. Apply migrations: npx supabase db reset');
    console.log('  3. Generate types: npx supabase gen types typescript --local > src/types/database.ts');
    return true;
  } catch (err) {
    console.error('❌ Supabase connection failed:');
    console.error(err.message);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  - Ensure Supabase is running: npx supabase start');
    console.log('  - Check .env.local has correct URL and anon key');
    console.log('  - Verify Docker is running (required for local Supabase)');
    return false;
  }
}

testConnection().then((success) => {
  process.exit(success ? 0 : 1);
});

