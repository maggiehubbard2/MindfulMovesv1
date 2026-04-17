import '@/config/supabase'; // Initialize Supabase
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { HabitsProvider } from '@/context/HabitsContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { useAppRefresh } from '@/hooks/useAppRefresh';
import { useAppResumeAuth } from '@/hooks/useAppResumeAuth';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect } from 'react';
import { View } from 'react-native';

// Prevent splash screen from auto-hiding while we load
// SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const router = useRouter();
  const segments = useSegments();
  const { authReady, user } = useAuth();

  useAppRefresh();
  useAppResumeAuth();

//  const inLogin = segments[0] === 'login';
//   const inTabs = segments[0] === '(tabs)';
  const isNavigationReady = segments.length > 0;

  // if (!authReady || !isNavigationReady) {
  //     return null;
  //   }

  

    
  useEffect(() => {
    console.log('[COLD_START] redirect effect; authReady:', authReady);
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

  // Hide splash once auth is hydrated (also in onLayout) so we still dismiss if onLayout does not refire.
  useEffect(() => {
    if (!authReady) return;
    console.log(
      '[COLD_START] authReady true; navigationReady:',
      isNavigationReady,
      'segments:',
      segments
    );
    SplashScreen.hideAsync().catch((error) => {
      console.error('[COLD_START] Error hiding splash screen (authReady effect):', error);
    });
  }, [authReady, isNavigationReady, segments]);

  useEffect(() => {
    if (authReady && !isNavigationReady) {
      console.log(
        '[COLD_START] authReady but segments empty — Stack not mounted yet',
        { segments }
      );
    }
  }, [authReady, isNavigationReady, segments]);

const onLayoutRootView = useCallback(async () => {
  if (authReady) {
    console.log('[COLD_START] Hiding splash after layout');
    await SplashScreen.hideAsync().catch((error) => {
      console.error('[COLD_START] Error hiding splash screen (onLayout):', error);
    });
  }
}, [authReady]);

return (
  <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
    {authReady && isNavigationReady ? (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="addhabit"
          options={{ headerShown: false, presentation: 'modal' }}
        />
        <Stack.Screen
          name="editprofile"
          options={{ headerShown: false, presentation: 'modal' }}
        />
      </Stack>
    ) : null}
  </View>
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
