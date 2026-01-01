import { useAuth } from '@/context/AuthContext';
import { router, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const { user, loading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (user) {
      // User is authenticated, redirect to dashboard
      router.replace('/(tabs)/dashboard');
    } else {
      // User is not authenticated, redirect to login
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

