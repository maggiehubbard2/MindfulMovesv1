import HabitList from '@/components/HabitList';
import { useAuth } from '@/context/AuthContext';
import { useHabits } from '@/context/HabitsContext';
import { ThemeContextType, useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HabitsScreen() {
  const { habits, toggleHabit, removeHabit } = useHabits();
  const { colors, isDarkMode }: ThemeContextType = useTheme();
  const { userProfile } = useAuth();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          <Text style={[styles.greeting, { color: colors.text }]}>
            {userProfile?.firstName}'s Habits
          </Text>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Build Better Routines</Text>
        </View>
        <HabitList 
          habits={habits} 
          onToggleHabit={toggleHabit}
          onRemoveHabit={removeHabit}
        />
        
        {/* Floating Action Button */}
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/(tabs)/addhabit')}
        >
          <Ionicons name="add" size={28} color="white" />
        </TouchableOpacity>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    opacity: 0.7,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 80, // Adjusted to be above tab bar
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 1000, // Added zIndex for visibility
  },
});

