import '@/config/supabase'; // Initialize Supabase
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { HabitsProvider } from '@/context/HabitsContext';
import { SubscriptionProvider } from '@/context/SubscriptionContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { useAppRefresh } from '@/hooks/useAppRefresh';
import { useAppResumeAuth } from '@/hooks/useAppResumeAuth';
import { useProAccentEnforcement } from '@/hooks/useProAccentEnforcement';
import { Image } from 'expo-image';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

const SPLASH_BACKGROUND = '#ffffff';
/** Full length of assets/images/splash.gif (150 frames). */
const SPLASH_GIF_DURATION_MS = 5000;
const SPLASH_FADE_OUT_MS = 500;

function RootLayoutNav() {
  const router = useRouter();
  const segments = useSegments();
  const { authReady, user } = useAuth();
  const [showAnimatedSplash, setShowAnimatedSplash] = useState(true);
  const splashOpacity = useRef(new Animated.Value(1)).current;
  const hasHiddenNativeSplash = useRef(false);
  const hasStartedFadeOut = useRef(false);

  useAppRefresh();
  useAppResumeAuth();
  useProAccentEnforcement();

  const isNavigationReady = segments.length > 0;

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
  }, [user, authReady, segments, router]);

  useEffect(() => {
    if (authReady && !isNavigationReady) {
      console.log('[COLD_START] authReady but segments empty — Stack not mounted yet', {
        segments,
      });
    }
  }, [authReady, isNavigationReady, segments]);

  const hideNativeSplash = useCallback(() => {
    if (hasHiddenNativeSplash.current) return;
    hasHiddenNativeSplash.current = true;
    console.log('[COLD_START] Hiding native splash over GIF overlay');
    SplashScreen.hideAsync().catch((error) => {
      console.error('[COLD_START] Error hiding splash screen:', error);
    });
  }, []);

  const onAnimatedSplashLayout = useCallback(() => {
    if (!authReady) return;
    hideNativeSplash();
  }, [authReady, hideNativeSplash]);

  // Fallback if onLayout does not fire after the GIF overlay mounts.
  useEffect(() => {
    if (!authReady || !showAnimatedSplash) return;
    const timeout = setTimeout(hideNativeSplash, 100);
    return () => clearTimeout(timeout);
  }, [authReady, showAnimatedSplash, hideNativeSplash]);

  // Play the GIF once, then fade into the app.
  useEffect(() => {
    if (!authReady || !showAnimatedSplash || hasStartedFadeOut.current) return;

    const timeout = setTimeout(() => {
      hasStartedFadeOut.current = true;
      Animated.timing(splashOpacity, {
        toValue: 0,
        duration: SPLASH_FADE_OUT_MS,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setShowAnimatedSplash(false);
        }
      });
    }, SPLASH_GIF_DURATION_MS);

    return () => clearTimeout(timeout);
  }, [authReady, showAnimatedSplash, splashOpacity]);

  return (
    <View style={styles.root}>
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

      {authReady && showAnimatedSplash ? (
        <Animated.View
          pointerEvents="none"
          onLayout={onAnimatedSplashLayout}
          style={[styles.splashOverlay, { opacity: splashOpacity }]}
        >
          <Image
            source={require('../assets/images/splash.gif')}
            style={styles.splashGif}
            contentFit="contain"
          />
        </Animated.View>
      ) : null}
    </View>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.preventAutoHideAsync();
    // Instant handoff into the white GIF overlay — no native fade flash.
    SplashScreen.setOptions({ fade: false, duration: 0 });
    console.log('[COLD_START] RootLayout mounting...');

    return () => {
      console.log('[COLD_START] RootLayout unmounting');
    };
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <SubscriptionProvider>
          <HabitsProvider>
            <RootLayoutNav />
          </HabitsProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  splashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: SPLASH_BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  splashGif: {
    width: 200,
    height: 200,
  },
});
