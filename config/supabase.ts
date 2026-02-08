import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

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

// Use AsyncStorage on web (expo-secure-store has no native module there);
// use SecureStore on iOS/Android for keychain-backed storage.
const storageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') {
        return await AsyncStorage.getItem(key);
      }
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('Error getting item from storage:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.setItem(key, value);
        return;
      }
      await SecureStore.setItemAsync(key, value, {
        requireAuthentication: false,
        keychainAccessible: SecureStore.WHEN_UNLOCKED,
      });
    } catch (error) {
      console.error('Error setting item in storage:', error);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.removeItem(key);
        return;
      }
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('Error removing item from storage:', error);
    }
  },
};

// Log initialization for cold start debugging
console.log('[COLD_START] Supabase client initializing...');
const initStartTime = Date.now();

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Enable automatic session refresh
    autoRefreshToken: true,
    // Persist sessions using secure storage (device keychain)
    persistSession: true,
    // Detect session from URL (for deep links)
    detectSessionInUrl: true,
    // Use storageAdapter: AsyncStorage on web, SecureStore on iOS/Android
    storage: storageAdapter,
    // Storage key for session persistence
    storageKey: 'supabase.auth.token',
  },
  db: {
    // Use faster schema lookup
    schema: 'public',
  },
});

const initDuration = Date.now() - initStartTime;
console.log(`[COLD_START] Supabase client initialized in ${initDuration}ms`);