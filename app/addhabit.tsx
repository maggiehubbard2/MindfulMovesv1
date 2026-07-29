import AddHabit from '@/components/AddHabit';
import { useHabits } from '@/context/HabitsContext';
import { useHabitLimitGate } from '@/hooks/useHabitLimitGate';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function AddHabitModalScreen() {
  const { addHabit } = useHabits();
  const { ensureCanAddHabit } = useHabitLimitGate();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const canAdd = await ensureCanAddHabit();
      if (!mounted) return;
      if (!canAdd) {
        router.back();
        return;
      }
      setAllowed(true);
    })();
    return () => {
      mounted = false;
    };
  }, [ensureCanAddHabit]);

  if (!allowed) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return <AddHabit onAddHabit={addHabit} />;
}
