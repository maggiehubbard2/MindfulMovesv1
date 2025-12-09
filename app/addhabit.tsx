import AddHabit from '@/components/AddHabit';
import { useHabits } from '@/context/HabitsContext';
import React from 'react';

export default function AddHabitModalScreen() {
  const { addHabit } = useHabits();

  return <AddHabit onAddHabit={addHabit} />;
}



