import AddHabit from '@/components/AddHabit';
import Quote from '@/components/Quote';
import { useHabits } from '@/context/HabitsContext';
import { getRandomQuote } from '@/utils/quoteUtils';
import React from 'react';
import { StyleSheet, View } from 'react-native';

function AddScreenContent() {
  const { addHabit } = useHabits();
  const quote = getRandomQuote();

  return (
    <View style={styles.container}>
      <Quote text={quote.text} author={quote.author} style={styles.quote} />
      <AddHabit onAddHabit={addHabit} />
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
