import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { router, Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const { colors, isDarkMode } = useTheme();
  const { user, authReady } = useAuth();
  const colorScheme = useColorScheme();
  const navigationBackground = isDarkMode ? '#F2F2F7' : colors.card;
  const navigationBorder = isDarkMode ? '#C6C6C8' : colors.border;
  const navigationText = isDarkMode ? '#1C1C1E' : colors.text;
  const tabInactiveTint = isDarkMode ? '#3C3C43' : colors.text;
  
  // Override icon colors to white in system dark mode for better visibility
  // This ensures menu icons remain visible regardless of user theme settings
  const isSystemDarkMode = colorScheme === 'dark';
  const tabBarActiveColor = isSystemDarkMode ? '#FFFFFF' : colors.primary;
  const tabBarInactiveColor = isSystemDarkMode ? 'rgba(255, 255, 255, 0.6)' : tabInactiveTint;

  useEffect(() => {
    if (authReady && !user) {
      router.replace('/login');
    }
  }, [user, authReady]);

  if (!authReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tabBarActiveColor,
        tabBarInactiveTintColor: tabBarInactiveColor,
        headerStyle: {
          backgroundColor: navigationBackground,
        },
        headerTintColor: navigationText,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            backgroundColor: navigationBackground,
            borderTopColor: navigationBorder,
            position: 'absolute',
          },
          default: {
            backgroundColor: navigationBackground,
            borderTopColor: navigationBorder,
          },
        }),
      }}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="habits"
        options={{
          title: 'Habits',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="checkmark-done-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="streak"
        options={{
          title: 'Calendar',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="flame-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}