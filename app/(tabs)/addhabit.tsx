import AddHabit from '@/components/AddHabit';
import Quote from '@/components/Quote';
import { useHabits } from '@/context/HabitsContext';
import { getRandomQuote } from '@/utils/quoteUtils';
import React from 'react';
import { StyleSheet, View } from 'react-native';

function AddHabitScreenContent() {
  const { addHabit } = useHabits();
  const quote = getRandomQuote();

  return (
    <View style={styles.container}>
      <Quote text={quote.text} author={quote.author} style={styles.quote} />
      <AddHabit onAddHabit={addHabit} />
    </View>
  );
}

export default function AddHabitScreen() {
  return <AddHabitScreenContent />;
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

