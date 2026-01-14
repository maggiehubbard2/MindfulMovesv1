import { supabase } from '@/config/supabase';
import { useAuth } from '@/context/AuthContext';
import { useHabits } from '@/context/HabitsContext';
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

// Time-based guard to prevent excessive API calls
let lastRefreshTime = 0;
const REFRESH_COOLDOWN = 30000; // 30 seconds

/**
 * Hook that listens for app state changes and triggers a soft refresh
 * when the app returns to the foreground.
 * 
 * Only triggers on foreground transitions (not initial mount).
 * Safe to call multiple times.
 * 
 * Refreshes:
 * - User profile (via AuthContext)
 * - Habits (via HabitsContext)
 */
export function useAppRefresh() {
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const isInitialMount = useRef(true);
  const { refreshUserProfile } = useAuth();
  const { refresh: refreshHabits } = useHabits();

  useEffect(() => {
    // Skip the initial mount - we only want to refresh on foreground transitions
    if (isInitialMount.current) {
      isInitialMount.current = false;
    }

    const subscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      // Only trigger refresh when app transitions from background/inactive to active
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        !isInitialMount.current
      ) {
        // Time guard: Skip if last refresh was too recent
        const now = Date.now();
        if (now - lastRefreshTime < REFRESH_COOLDOWN) {
          if (__DEV__) {
            console.log('App refresh skipped: too soon since last refresh');
          }
          appState.current = nextAppState;
          return;
        }

        // App came to foreground - trigger soft refresh
        try {
          // Check if Supabase session exists
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            if (__DEV__) {
              console.error('Error checking session:', sessionError);
            }
            appState.current = nextAppState;
            return;
          }

          // If no session, user is not logged in - skip refresh
          if (!session) {
            if (__DEV__) {
              console.log('App refresh skipped: no active session');
            }
            appState.current = nextAppState;
            return;
          }

          // Session exists - refresh data in parallel
          await Promise.allSettled([
            refreshUserProfile(),
            refreshHabits(),
          ]);

          // Update timestamp after successful refresh
          lastRefreshTime = now;
          
          if (__DEV__) {
            console.log('App refresh completed');
          }
        } catch (error) {
          // Fail silently - don't disrupt UX
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
  }, [refreshUserProfile, refreshHabits]);
}

