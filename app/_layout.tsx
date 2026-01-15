import '@/config/supabase'; // Initialize Supabase
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { HabitsProvider } from '@/context/HabitsContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { useAppRefresh } from '@/hooks/useAppRefresh';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

// Prevent splash screen from auto-hiding while we load
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { colors } = useTheme();
  const { loading } = useAuth();
  
  // Enable app refresh on foreground transitions
  useAppRefresh();

  // Hide splash screen once auth is initialized
  useEffect(() => {
    if (!loading) {
      console.log('[COLD_START] Auth loading complete, hiding splash screen');
      SplashScreen.hideAsync().catch((error) => {
        console.error('[COLD_START] Error hiding splash screen:', error);
      });
    }
  }, [loading]);

  // Safety timeout: hide splash after 5 seconds even if auth is still loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      console.log('[COLD_START] Splash screen timeout (5s), forcing hide');
      SplashScreen.hideAsync().catch(() => {
        // Ignore errors on timeout hide
      });
    }, 5000);

    return () => clearTimeout(timeout);
  }, []);
  
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="login" 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="(tabs)" 
        options={{ headerShown: false }} 
      />
      <Stack.Screen
        name="addhabit"
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen 
        name="editprofile" 
        options={{ 
          headerShown: false,
          presentation: 'modal'
        }} 
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    console.log('[COLD_START] RootLayout mounting...');
    console.log('[COLD_START] Preventing splash auto-hide');
    return () => {
      console.log('[COLD_START] RootLayout unmounting');
    };
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <HabitsProvider>
          <RootLayoutNav />
        </HabitsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
