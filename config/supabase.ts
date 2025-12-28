import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
// Create a .env file in the root directory with:
// EXPO_PUBLIC_SUPABASE_URL=your_project_url
// EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
// 
// Get these from: https://app.supabase.com/project/_/settings/api

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'YOUR_SUPABASE_URL' || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
  throw new Error(
    '❌ Supabase credentials not configured!\n\n' +
    'Please create a .env file in the root directory with:\n' +
    'EXPO_PUBLIC_SUPABASE_URL=your_project_url\n' +
    'EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key\n\n' +
    'Get your credentials from: https://app.supabase.com/project/_/settings/api'
  );
}

// Create a storage adapter for AsyncStorage to persist Supabase sessions
const AsyncStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('Error getting item from AsyncStorage:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Error setting item in AsyncStorage:', error);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing item from AsyncStorage:', error);
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Enable automatic session refresh
    autoRefreshToken: true,
    // Persist sessions using AsyncStorage
    persistSession: true,
    // Detect session from URL (for deep links)
    detectSessionInUrl: true,
    // Use AsyncStorage adapter for session persistence
    storage: AsyncStorageAdapter,
    // Storage key for session persistence
    storageKey: 'supabase.auth.token',
  },
  db: {
    // Use faster schema lookup
    schema: 'public',
  },
});

