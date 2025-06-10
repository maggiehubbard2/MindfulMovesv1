import HabitList from '@/components/HabitList';
import { useHabits } from '@/context/HabitsContext';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TabOneScreen() {
  const { habits, showEmojis, isDarkMode, addHabit, toggleHabit, removeHabit } = useHabits();

  const backgroundColor = isDarkMode ? '#1a1a1a' : '#f5f5f5';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      
      <HabitList 
        habits={habits} 
        showEmojis={showEmojis} 
        onToggleHabit={toggleHabit}
        onRemoveHabit={removeHabit}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
