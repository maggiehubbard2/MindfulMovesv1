import HabitList from '@/components/HabitList';
import { useHabits } from '@/context/HabitsContext';
import { ThemeContextType, useTheme } from '@/context/ThemeContext';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TabOneScreen() {
  const { habits, showEmojis, addHabit, toggleHabit, removeHabit } = useHabits();
  const { colors, isDarkMode, toggleDarkMode }: ThemeContextType = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea}>        
        
        <HabitList 
          habits={habits} 
          showEmojis={showEmojis} 
          onToggleHabit={toggleHabit}
          onRemoveHabit={removeHabit}
        />        
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
});
