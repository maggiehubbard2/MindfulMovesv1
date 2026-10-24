import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { useTheme } from '@/context/ThemeContext';
import { isDemoMode } from '@/utils/demoMode';
import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';

/**
 * Custom is the only Pro-locked accent. The alert waits until this account's
 * profile accent and this account's RevenueCat customer have both loaded.
 * A non-Pro user keeps the saved custom color but sees blue for this session.
 * Pink, green, and purple are left alone.
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
  const isAdmin = userProfile?.isAdmin === true;
  const alertedForUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (isDemoMode()) return;
    const userId = user?.id;
    if (!userId) return;
    if (isLoading || identifiedUserId !== userId) return;
    if (accentResolvedForUserId !== userId) return;

    if (isPro || isAdmin) {
      alertedForUserRef.current = null;
      if (persistedAccentColor === 'custom') {
        restorePersistedAccent();
      }
      return;
    }

    if (persistedAccentColor !== 'custom') return;

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
    isAdmin,
    isLoading,
    isPro,
    persistedAccentColor,
    restorePersistedAccent,
    user?.id,
  ]);
}
