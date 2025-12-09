import { useAuth } from '@/context/AuthContext';
import { router, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const { user, loading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (loading) {
      console.log('[Index] Auth loading...');
      return;
    }

    if (user) {
      // User is authenticated, redirect to dashboard
      console.log('[Index] User authenticated, routing to /(tabs)/dashboard');
      router.replace('/(tabs)/dashboard');
    } else {
      // User is not authenticated, redirect to login
      console.log('[Index] No user, routing to /login');
      router.replace('/login');
    }
  }, [user, loading]);

  // Show loading indicator while checking auth
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}

