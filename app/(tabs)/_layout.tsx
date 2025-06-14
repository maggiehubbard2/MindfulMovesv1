import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const { colors } = useTheme();
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text,
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTintColor: colors.text,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            position: 'absolute',
          },
          default: {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
          },
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Habits',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Add Habit',
          headerShown: true,
          headerTitle: 'Add New Habit',
          headerStyle: {
            backgroundColor: colors.card,
          },
          headerTintColor: colors.primary,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="manager"
        options={{
          title: 'Habit Manager',
          headerShown: false,
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="checkmark.circle" color={color} />,
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
