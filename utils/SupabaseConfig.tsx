import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Create a single supabase client for interacting with your database
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_API_KEY || '';

let supabase: SupabaseClient | null = null;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials not configured. Cloud sync will not work.', {
    supabaseUrl,
    hasKey: !!supabaseKey,
  });
} else {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('Supabase client initialised', { supabaseUrl });
}

export { supabase };