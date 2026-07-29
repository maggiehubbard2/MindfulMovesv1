import { canAddHabit, FREE_HABIT_LIMIT } from '@/config/subscription';
import { useAuth } from '@/context/AuthContext';
import { useHabits } from '@/context/HabitsContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { useCallback } from 'react';
import { Alert } from 'react-native';

/**
 * Shared gate for adding habits: free users are capped at FREE_HABIT_LIMIT.
 * Shows the RevenueCat paywall when the limit is hit.
 */
export function useHabitLimitGate() {
  const { habits } = useHabits();
  const { isPro, presentPaywallIfNeeded } = useSubscription();
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.isAdmin === true;

  const ensureCanAddHabit = useCallback(async (): Promise<boolean> => {
    if (canAddHabit(isPro, habits.length, isAdmin)) {
      return true;
    }

    const unlocked = await presentPaywallIfNeeded();
    // After a successful purchase, entitlement updates asynchronously — allow through
    // when the paywall reports purchased/restored/already entitled.
    if (unlocked) {
      return true;
    }

    Alert.alert(
      'Habit limit reached',
      `Free accounts can track up to ${FREE_HABIT_LIMIT} habits. Upgrade to Pro for unlimited habits.`
    );
    return false;
  }, [habits.length, isAdmin, isPro, presentPaywallIfNeeded]);

  return {
    ensureCanAddHabit,
    freeHabitLimit: FREE_HABIT_LIMIT,
    isAtHabitLimit: !canAddHabit(isPro, habits.length, isAdmin),
  };
}
