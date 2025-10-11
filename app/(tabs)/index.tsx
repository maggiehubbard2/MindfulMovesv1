import TaskList from '@/components/TaskList';
import { useTasks } from '@/context/TasksContext';
import { ThemeContextType, useTheme } from '@/context/ThemeContext';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TabOneScreen() {
  const { tasks, showEmojis, addTask, toggleTask, removeTask } = useTasks();
  const { colors, isDarkMode, toggleDarkMode }: ThemeContextType = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea}>        
        
        <TaskList 
          tasks={tasks} 
          showEmojis={showEmojis} 
          onToggleTask={toggleTask}
          onRemoveTask={removeTask}
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
