import { useAuth } from '@/context/AuthContext';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

const BACKGROUND_TIMESTAMP_KEY = 'app_background_timestamp';
const INACTIVITY_THRESHOLD_MS = 60 * 1000; // 60 seconds

/**
 * Tracks app background time and asks AuthContext to refresh session when app
 * returns to foreground after > 60s inactivity. Does NOT call getSession() directly—
 * that would race with AuthContext's single initial hydration on cold start.
 */
export function useAppResumeAuth() {
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const isInitialMount = useRef(true);
  const { authReady, refreshSession } = useAuth();

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      const previousState = appState.current;
      appState.current = nextAppState;

      if (previousState === 'active' && nextAppState.match(/inactive|background/)) {
        const timestamp = Date.now().toString();
        try {
          await SecureStore.setItemAsync(BACKGROUND_TIMESTAMP_KEY, timestamp, {
            requireAuthentication: false,
            keychainAccessible: SecureStore.WHEN_UNLOCKED,
          });
          if (__DEV__) {
            console.log('[AppResumeAuth] App backgrounded, timestamp saved');
          }
        } catch (error) {
          if (__DEV__) {
            console.error('[AppResumeAuth] Error saving background timestamp:', error);
          }
        }
      }

      // Only run refresh on foreground transition (not cold start). Never run before authReady.
      if (
        previousState.match(/inactive|background/) &&
        nextAppState === 'active' &&
        !isInitialMount.current &&
        authReady
      ) {
        await checkAndRefreshSession();
      }
    });

    if (isInitialMount.current) {
      isInitialMount.current = false;
    }

    return () => {
      subscription.remove();
    };
  }, [authReady]);

  const checkAndRefreshSession = async () => {
    try {
      const backgroundTimestampStr = await SecureStore.getItemAsync(BACKGROUND_TIMESTAMP_KEY);
      if (!backgroundTimestampStr) {
        if (__DEV__) {
          console.log('[AppResumeAuth] No background timestamp found, skipping refresh');
        }
        return;
      }

      const backgroundTimestamp = parseInt(backgroundTimestampStr, 10);
      const now = Date.now();
      const inactiveDuration = now - backgroundTimestamp;

      if (__DEV__) {
        console.log(`[AppResumeAuth] App was inactive for ${Math.round(inactiveDuration / 1000)}s`);
      }

      if (inactiveDuration >= INACTIVITY_THRESHOLD_MS) {
        if (__DEV__) {
          console.log('[AppResumeAuth] Inactivity threshold exceeded, refreshing session via AuthContext...');
        }
        await refreshSession();
      }

      await SecureStore.deleteItemAsync(BACKGROUND_TIMESTAMP_KEY).catch(() => {});
    } catch (error) {
      if (__DEV__) {
        console.error('[AppResumeAuth] Error checking/refreshing session:', error);
      }
    }
  };
}
