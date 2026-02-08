import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const { user, authReady } = useAuth();

  useEffect(() => {
    if (!authReady) {
      return;
    }
    // Only interpret user === null as "logged out" after hydration completes.
    if (user) {
      router.replace('/(tabs)/dashboard');
    } else {
      router.replace('/login');
    }
  }, [user, authReady]);

  // Show loading indicator while checking auth
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}

