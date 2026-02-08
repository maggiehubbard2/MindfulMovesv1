import { useTheme } from '@/context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, View } from 'react-native';

export default function DashboardSkeleton() {
  const { colors } = useTheme();
  const placeholder = colors.text + '15';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.topHeader}>
          <View style={styles.greetingContainer}>
            <View style={[styles.greetingLine, { backgroundColor: placeholder }]} />
            <View style={[styles.dateLine, { backgroundColor: placeholder }]} />
          </View>
          <View style={[styles.avatarPlaceholder, { backgroundColor: placeholder }]} />
        </View>

        {/* Weekly calendar strip */}
        <View style={styles.calendarStrip}>
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <View key={i} style={[styles.calendarDay, { backgroundColor: placeholder }]} />
          ))}
        </View>

        {/* Reminder card placeholder */}
        <View style={[styles.reminderCard, { backgroundColor: placeholder }]} />

        {/* Habit row placeholders */}
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={[styles.habitRow, { backgroundColor: placeholder }]} />
        ))}
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
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  greetingContainer: {
    flex: 1,
  },
  greetingLine: {
    height: 28,
    width: '70%',
    borderRadius: 6,
    marginBottom: 8,
  },
  dateLine: {
    height: 14,
    width: '50%',
    borderRadius: 4,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginLeft: 16,
  },
  calendarStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  calendarDay: {
    flex: 1,
    aspectRatio: 0.9,
    borderRadius: 12,
  },
  reminderCard: {
    marginHorizontal: 20,
    height: 80,
    borderRadius: 16,
    marginBottom: 20,
  },
  habitRow: {
    marginHorizontal: 20,
    height: 56,
    borderRadius: 12,
    marginBottom: 12,
  },
});
