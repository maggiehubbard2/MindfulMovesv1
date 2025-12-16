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

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

