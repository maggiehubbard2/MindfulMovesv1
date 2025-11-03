import AddTask from '@/components/AddTask';
import { TaskFrequency, useTasks } from '@/context/TasksContext';
import React from 'react';
import { StyleSheet, View } from 'react-native';

function AddScreenContent() {
  const { addTask } = useTasks();

  const handleAddTask = (name: string, emoji: string, frequency: TaskFrequency, habitId?: string) => {
    addTask(name, emoji, frequency, habitId);
  };

  return (
    <View style={styles.container}>
      <AddTask onAddTask={handleAddTask} />
    </View>
  );
}

export default function AddScreen() {
  return <AddScreenContent />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
