import DailyHabitList from '@/components/DailyHabitList';
import ReminderCard from '@/components/ReminderCard';
import ShareWinScreen from '@/components/ShareWinScreen';
import WeeklyCalendar from '@/components/WeeklyCalendar';
import { useAuth } from '@/context/AuthContext';
import { useHabits } from '@/context/HabitsContext';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ConfettiCannon from 'react-native-confetti-cannon';

export default function DashboardScreen() {
  const { colors, isDarkMode } = useTheme();
  const { userProfile } = useAuth();
  const { setSelectedDate, getHabitsForDate, selectedDate, habits } = useHabits();
  const [showConfetti, setShowConfetti] = useState(false);
  const [showShareWin, setShowShareWin] = useState(false);
  const confettiTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shareWinTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wasAllCompletedRef = useRef(false);

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
    // Navigate to habits screen with the selected date
    setSelectedDate(date);
    router.push('/(tabs)/habits');
  };

  // Check if all habits are completed and trigger confetti
  const checkAllHabitsCompleted = () => {
    const habitsForDate = getHabitsForDate(selectedDate);
    if (habitsForDate.length === 0) {
      setShowConfetti(false);
      setShowShareWin(false);
      wasAllCompletedRef.current = false;
      return; // No habits, no confetti
    }
    
    const allCompleted = habitsForDate.every(habit => habit.completed);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDateNormalized = new Date(selectedDate);
    selectedDateNormalized.setHours(0, 0, 0, 0);
    const isToday = selectedDateNormalized.getTime() === today.getTime();
    
    // Only trigger if transitioning from not all completed to all completed
    if (allCompleted && isToday && !wasAllCompletedRef.current) {
      // Clear any existing timeouts
      if (confettiTimeoutRef.current) clearTimeout(confettiTimeoutRef.current);
      if (shareWinTimeoutRef.current) clearTimeout(shareWinTimeoutRef.current);
      
      setShowConfetti(true);
      wasAllCompletedRef.current = true;
      
      // Hide confetti after animation completes, then show share screen
      confettiTimeoutRef.current = setTimeout(() => {
        setShowConfetti(false);
        // Double-check if all habits are still completed before showing share screen
        const currentHabits = getHabitsForDate(selectedDate);
        const stillAllCompleted = currentHabits.every(habit => habit.completed);
        if (stillAllCompleted) {
          shareWinTimeoutRef.current = setTimeout(() => {
            setShowShareWin(true);
          }, 500); // Small delay after confetti fades
        }
      }, 3000); // Confetti duration
    } else if (!allCompleted || !isToday) {
      setShowConfetti(false);
      setShowShareWin(false);
      wasAllCompletedRef.current = false;
      // Clear any pending timeouts if habits are unchecked or date changes
      if (confettiTimeoutRef.current) clearTimeout(confettiTimeoutRef.current);
      if (shareWinTimeoutRef.current) clearTimeout(shareWinTimeoutRef.current);
    }
  };

  // Check when habits change
  useEffect(() => {
    checkAllHabitsCompleted();
    return () => {
      // Cleanup on unmount or dependency change
      if (confettiTimeoutRef.current) clearTimeout(confettiTimeoutRef.current);
      if (shareWinTimeoutRef.current) clearTimeout(shareWinTimeoutRef.current);
    };
  }, [selectedDate, habits]);

  // Reset confetti and share screen when date changes
  useEffect(() => {
    setShowConfetti(false);
    setShowShareWin(false);
    wasAllCompletedRef.current = false;
    if (confettiTimeoutRef.current) clearTimeout(confettiTimeoutRef.current);
    if (shareWinTimeoutRef.current) clearTimeout(shareWinTimeoutRef.current);
  }, [selectedDate]);

  // Handle habit toggle callback
  const handleHabitToggle = () => {
    // Use setTimeout to check after state updates
    setTimeout(() => {
      checkAllHabitsCompleted();
    }, 100);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />
        
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
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

      {/* Share Win Screen */}
      <ShareWinScreen visible={showShareWin} onClose={() => setShowShareWin(false)} />
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
