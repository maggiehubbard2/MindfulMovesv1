import AddHabit from '@/components/AddHabit';
import { useHabits } from '@/context/HabitsContext';
import { StyleSheet } from 'react-native';

export default function AddScreen() {
  const { addHabit } = useHabits();
  return <AddHabit onAddHabit={addHabit} />;
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
});
