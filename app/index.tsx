import { useAuth } from '@/context/AuthContext';
import { useOnboarding } from '@/context/OnboardingContext';
import { getPostAuthHref } from '@/utils/authRoute';
import { router, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const { user, authReady } = useAuth();
  const { phase } = useOnboarding();
  const segment = useSegments()[0];

  useEffect(() => {
    if (!authReady) return;
    const href = getPostAuthHref({
      hasUser: Boolean(user),
      phase,
      segment,
    });
    if (href) {
      router.replace(href);
    }
  }, [user, authReady, phase, segment]);

  // Show loading indicator while checking auth
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}

