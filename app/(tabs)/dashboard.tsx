import DailyHabitList from '@/components/DailyHabitList';
import ReminderCard from '@/components/ReminderCard';
import WeeklyCalendar from '@/components/WeeklyCalendar';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DashboardScreen() {
  const { colors, isDarkMode } = useTheme();
  const { userProfile } = useAuth();

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
    // Could navigate to a detailed view for that date
    console.log('Date pressed:', date.toISOString().split('T')[0]);
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
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="person" size={24} color={colors.primary} />
            </View>
          </View>

          {/* Weekly Calendar */}
          <WeeklyCalendar onDatePress={handleDatePress} />

          {/* Reminder Card */}
          <ReminderCard />

          {/* Daily Routine List */}
          <DailyHabitList maxItems={4} />

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
