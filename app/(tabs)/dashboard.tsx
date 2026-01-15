import DailyHabitList from '@/components/DailyHabitList';
import ReminderCard from '@/components/ReminderCard';
import ShareStreakScreen from '@/components/ShareStreakScreen';
import WeeklyCalendar from '@/components/WeeklyCalendar';
import { useAuth } from '@/context/AuthContext';
import { useHabits } from '@/context/HabitsContext';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DashboardScreen() {
  const { colors, isDarkMode } = useTheme();
  const { userProfile, refreshUserProfile } = useAuth();
  const { setSelectedDate, getHabitsForDate, selectedDate, habits, calculateLongestStreak, refresh } = useHabits();
  const [showConfetti, setShowConfetti] = useState(false);
  const [showShareScreen, setShowShareScreen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  // Track previous completion state to detect transitions (prevents confetti on deselection)
  const previousAllCompletedRef = useRef<boolean | null>(null);

  // Get time-based greeting
  const today = new Date();
  const hour = today.getHours();
  let greeting = 'Hello';
  if (hour < 12) {
    greeting = 'Morning';
  } else if (hour < 18) {
    greeting = 'Afternoon';
  } else {
    greeting = 'Evening';
  }

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDayName = dayNames[today.getDay()];
  const formattedDate = today.toLocaleDateString('en-US', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  const handleDatePress = (date: Date) => {
    setSelectedDate(date);
  };

  // Check if all habits are completed and trigger confetti
  const checkAllHabitsCompleted = () => {
    const habitsForDate = getHabitsForDate(selectedDate);
    if (habitsForDate.length === 0) {
      setShowConfetti(false);
      previousAllCompletedRef.current = false;
      return; // No habits, no confetti
    }
    
    const allCompleted = habitsForDate.every(habit => habit.completed);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDateNormalized = new Date(selectedDate);
    selectedDateNormalized.setHours(0, 0, 0, 0);
    const isToday = selectedDateNormalized.getTime() === today.getTime();
    
    // Only check for today's habits
    if (!isToday) {
      setShowConfetti(false);
      previousAllCompletedRef.current = false;
      return;
    }
    
    // Get previous state (null on first render to prevent confetti on initial load)
    const previousAllCompleted = previousAllCompletedRef.current;
    
    // Trigger confetti only when transitioning from incomplete to all complete
    // This prevents confetti from triggering when deselecting habits or on initial render
    if (previousAllCompleted === false && allCompleted === true) {
      setShowConfetti(true);
      // Hide confetti after animation completes, then show share screen
      setTimeout(() => {
        setShowConfetti(false);
        
        // Check if there's a streak worth celebrating
        const streak = calculateLongestStreak();
        
      
        if (streak > 0) {
          setShowShareScreen(true);
        }
      }, 3000);
    } else {
      // Don't show confetti for other state transitions (true→false, true→true, or initial render)
      setShowConfetti(false);
    }
    
    // Update the ref with current state for next comparison
    previousAllCompletedRef.current = allCompleted;
  };

  // Check when habits change
  useEffect(() => {
    checkAllHabitsCompleted();
  }, [selectedDate, habits]);

  // Reset confetti and previous state when date changes
  useEffect(() => {
    setShowConfetti(false);
    previousAllCompletedRef.current = null; // Reset to null so we don't trigger on date change
  }, [selectedDate]);

  // Handle habit toggle callback
  const handleHabitToggle = () => {
    // Use setTimeout to check after state updates
    setTimeout(() => {
      checkAllHabitsCompleted();
    }, 100);
  };

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh both habits and user profile data
      await Promise.all([
        refresh(),
        refreshUserProfile(),
      ]);
    } catch (error) {
      // Silent fail - don't disrupt UX
      if (__DEV__) {
        console.error('Error refreshing dashboard:', error);
      }
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />
        
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {/* Header with Greeting and Profile */}
          <View style={styles.topHeader}>
            <View style={styles.greetingContainer}>
              <Text style={[styles.greeting, { color: colors.text }]}>
                {greeting}, {userProfile?.firstName || 'there'}
              </Text>
              <Text style={[styles.dateText, { color: colors.secondary }]}>
                {formattedDate}
              </Text>
            </View>
            {/* Profile Picture Placeholder */}
            <TouchableOpacity
              style={[styles.avatarPlaceholder, { backgroundColor: colors.primary + '20' }]}
              onPress={() => router.push('/(tabs)/settings')}
              activeOpacity={0.7}
            >
              <Ionicons name="person" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Weekly Calendar */}
          <WeeklyCalendar onDatePress={handleDatePress} />

          {/* Reminder Card */}
          <ReminderCard />

          {/* Daily Routine List */}
          <DailyHabitList onHabitToggle={handleHabitToggle} />

          {/* Floating Action Button */}
          <TouchableOpacity
            style={[styles.fab, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/addhabit')}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={28} color="white" />
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
      
      {/* Confetti Animation */}
      {showConfetti && (
        <ConfettiCannon
          count={200}
          origin={{ x: -10, y: 0 }}
          fadeOut={true}
          explosionSpeed={350}
          fallSpeed={3000}
        />
      )}

      {/* Share Streak Screen */}
      <ShareStreakScreen
        visible={showShareScreen}
        onClose={() => setShowShareScreen(false)}
      />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Space for FAB
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 90, // Above tab bar
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
});
