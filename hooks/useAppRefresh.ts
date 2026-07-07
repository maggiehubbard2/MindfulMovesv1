import { useAuth } from '@/context/AuthContext';
import { useHabits } from '@/context/HabitsContext';
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

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
        try {
          await Promise.allSettled([
            refreshUserProfile(),
            refreshHabits(),
          ]);
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
