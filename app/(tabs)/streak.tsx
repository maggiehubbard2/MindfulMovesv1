import MonthCalendar from '@/components/MonthCalendar';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function StreakScreen() {
  const { colors, isDarkMode } = useTheme();
  const { userProfile } = useAuth();

  const handleDatePress = (date: Date) => {
    // TODO: Could show detailed breakdown of habits for that day
    console.log('Date pressed:', date.toISOString().split('T')[0]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Your Progress
          </Text>
          <Text style={[styles.subtitle, { color: colors.secondary }]}>
            Track your habit completion daily
          </Text>
        </View>

        {/* Calendar */}
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <MonthCalendar onDatePress={handleDatePress} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
});
