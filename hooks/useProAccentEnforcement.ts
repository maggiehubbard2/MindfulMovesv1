import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { useTheme } from '@/context/ThemeContext';
import { isDemoMode } from '@/utils/demoMode';
import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';

/**
 * Custom is the only Pro-locked accent. Blue, pink, green, and purple stay as saved.
 * A database-premium or admin account keeps custom as soon as the profile accent is known.
 * Otherwise custom waits for this account's RevenueCat customer, and a non-Pro user sees blue.
 */
export function useProAccentEnforcement() {
  const { isPro, isLoading, identifiedUserId } = useSubscription();
  const {
    persistedAccentColor,
    accentResolvedForUserId,
    applySessionBlue,
    restorePersistedAccent,
  } = useTheme();
  const { user, userProfile } = useAuth();
  const alertedForUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (isDemoMode()) return;
    const userId = user?.id;
    if (!userId) return;
    if (accentResolvedForUserId !== userId) return;
    if (persistedAccentColor !== 'custom') return;

    const profile = userProfile?.id === userId ? userProfile : undefined;
    const isAdmin = profile?.isAdmin === true;
    const isPremium = profile?.isPremium;

    if (isPremium === true || isAdmin) {
      alertedForUserRef.current = null;
      restorePersistedAccent();
      return;
    }

    // Missing flag means the users row has not been read yet. Do not force blue.
    if (isPremium !== false) return;
    if (isLoading || identifiedUserId !== userId) return;

    if (isPro) {
      alertedForUserRef.current = null;
      restorePersistedAccent();
      return;
    }

    applySessionBlue();
    if (alertedForUserRef.current === userId) return;
    alertedForUserRef.current = userId;
    Alert.alert(
      'Custom accent is a Pro feature',
      'The custom accent saved on your account is locked for Pro. Blue will be used until you subscribe.'
    );
  }, [
    accentResolvedForUserId,
    applySessionBlue,
    identifiedUserId,
    isLoading,
    isPro,
    persistedAccentColor,
    restorePersistedAccent,
    user?.id,
    userProfile,
  ]);
}
