import '@/config/supabase'; // Initialize Supabase
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { HabitsProvider } from '@/context/HabitsContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { useAppRefresh } from '@/hooks/useAppRefresh';
import { useAppResumeAuth } from '@/hooks/useAppResumeAuth';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

// Prevent splash screen from auto-hiding while we load
// SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { colors } = useTheme();
  const router = useRouter();
const segments = useSegments();
  const { authReady, user } = useAuth();

  useAppRefresh();
  useAppResumeAuth();

   const inLogin = segments[0] === 'login';
  const inTabs = segments[0] === '(tabs)';

  useEffect(() => {
    console.log('checking authready: ', authReady);
    if (!authReady) return;

    const firstSegment = segments[0];
    const inLogin = firstSegment === 'login';

    if (!user && !inLogin) {
      console.log('redirecting to /login');
      router.replace('/login');
      return;
    }

    if (user && (inLogin || !firstSegment)) {
      console.log('redirecting to /dashboard');
      router.replace('/dashboard');
    }

}, [user, authReady, segments]);

  // Hide splash only after auth hydration so we never show Login before we know auth state.
  useEffect(() => {
    if (authReady) {
      SplashScreen.hideAsync().catch((error) => {
        console.error('[COLD_START] Error hiding splash screen:', error);
      });
    }
  }, [authReady]);

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

  console.log('Rendering Stack. User:', user, 'AuthReady:', authReady, 'Segments:', segments);
  
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
    SplashScreen.preventAutoHideAsync();
    console.log('[COLD_START] RootLayout mounting...');
    
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
