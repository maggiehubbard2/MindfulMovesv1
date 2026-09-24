import { isFreeAccentColor } from '@/config/subscription';
import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { useTheme } from '@/context/ThemeContext';
import { isDemoMode } from '@/utils/demoMode';
import { useEffect } from 'react';

/**
 * If the user loses Pro (or never had it) while on a Pro-only accent,
 * reset to the free default (blue).
 */
export function useProAccentEnforcement() {
  const { isPro, isLoading } = useSubscription();
  const { accentColor, setAccentColor } = useTheme();
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.isAdmin === true;

  useEffect(() => {
    if (isDemoMode()) return;
    if (isLoading) return;
    if (isPro || isAdmin) return;
    if (!isFreeAccentColor(accentColor)) {
      void setAccentColor('blue');
    }
  }, [accentColor, isAdmin, isLoading, isPro, setAccentColor]);
}
