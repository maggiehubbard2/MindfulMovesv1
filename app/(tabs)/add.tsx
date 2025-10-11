import AddTask from '@/components/AddTask';
import Quote from '@/components/Quote';
import { useTasks } from '@/context/TasksContext';
import { getRandomQuote } from '@/utils/quoteUtils';
import React from 'react';
import { StyleSheet, View } from 'react-native';

function AddScreenContent() {
  const { addTask } = useTasks();
  const quote = getRandomQuote();

  return (
    <View style={styles.container}>
      <Quote text={quote.text} author={quote.author} style={styles.quote} />
      <AddTask onAddTask={addTask} />
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
  quote: {
    marginHorizontal: 16,
    marginTop: 16,
  },
});
