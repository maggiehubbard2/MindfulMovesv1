import { useAuth } from '@/context/AuthContext';
import { isDemoMode } from '@/utils/demoMode';
import { ensureReminderPreferences } from '@/utils/reminderNotifications';
import { useEffect } from 'react';

/** Keep the device schedule aligned with saved reminder preferences after sign-in. */
export function useReminderSync() {
  const { authReady, user } = useAuth();
  const userId = user?.id;

  useEffect(() => {
    if (!authReady || !userId || isDemoMode()) return;
    ensureReminderPreferences(userId).catch((error) => {
      if (__DEV__) console.warn('[reminders] sync failed', error);
    });
  }, [authReady, userId]);
}
