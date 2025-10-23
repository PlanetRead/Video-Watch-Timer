import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Recommended for React Native

// Read values from process.env using the names from your .env file
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY; // Corrected variable name

// Add checks to see if variables loaded
if (!supabaseUrl) {
  console.error("❌ Supabase URL is missing! Check .env and restart Metro.");
}
if (!supabaseAnonKey) {
  console.error("❌ Supabase Anon Key is missing! Check .env (using EXPO_PUBLIC_SUPABASE_ANON_KEY) and restart Metro.");
}

// Log the loaded values (the key will just show if it exists)
console.log('🔧 Supabase URL Loaded:', supabaseUrl);
console.log('🔧 Supabase Key Loaded:', supabaseAnonKey ? 'Yes' : 'No');

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
  // Add AsyncStorage for React Native session persistence
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});