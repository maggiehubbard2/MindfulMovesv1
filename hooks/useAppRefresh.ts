import { useAuth } from '@/context/AuthContext';
import { useHabits } from '@/context/HabitsContext';
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

let lastRefreshTime = 0;
const REFRESH_COOLDOWN = 30000; // 30 seconds

/**
 * Triggers soft refresh (profile + habits) when app returns to foreground.
 * Uses AuthContext state only—no getSession()—so it never races with initial hydration.
 */
export function useAppRefresh() {
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const isInitialMount = useRef(true);
  const { user, authReady, refreshUserProfile } = useAuth();
  const { refresh: refreshHabits } = useHabits();

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    }

    const subscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        !isInitialMount.current &&
        authReady &&
        user
      ) {
        const now = Date.now();
        if (now - lastRefreshTime < REFRESH_COOLDOWN) {
          if (__DEV__) {
            console.log('App refresh skipped: too soon since last refresh');
          }
          appState.current = nextAppState;
          return;
        }

        try {
          await Promise.allSettled([
            refreshUserProfile(),
            refreshHabits(),
          ]);
          lastRefreshTime = now;
          if (__DEV__) {
            console.log('App refresh completed');
          }
        } catch (error) {
          if (__DEV__) {
            console.error('App refresh failed:', error);
          }
        }
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [authReady, user, refreshUserProfile, refreshHabits]);
}

