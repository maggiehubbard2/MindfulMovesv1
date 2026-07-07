import { useHabits } from '@/context/HabitsContext';
import { useTheme } from '@/context/ThemeContext';
import { getWeekStartSunday } from '@/utils/date';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface WeeklyCalendarProps {
  onDatePress?: (date: Date) => void;
}

export default function WeeklyCalendar({ onDatePress }: WeeklyCalendarProps) {
  const { colors } = useTheme();
  const { selectedDate } = useHabits();
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getWeekStartSunday(new Date()));

  const getWeekDates = (weekStart: Date): Date[] => {
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const todayWeekStart = useMemo(() => getWeekStartSunday(new Date()), [currentWeekStart]);

  const canNavigateForward = useMemo(() => {
    const nextWeekStart = new Date(currentWeekStart);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);
    return nextWeekStart.getTime() <= todayWeekStart.getTime();
  }, [currentWeekStart, todayWeekStart]);

  const navigateWeek = (direction: 'prev' | 'next') => {
    if (direction === 'next' && !canNavigateForward) return;

    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + (direction === 'prev' ? -7 : 7));
    setCurrentWeekStart(getWeekStartSunday(newStart));
  };

  const goToCurrentWeek = () => {
    setCurrentWeekStart(getWeekStartSunday(new Date()));
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const weekDates = getWeekDates(currentWeekStart);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigateWeek('prev')}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.weekTitleButton}
          onPress={goToCurrentWeek}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
        >
          <Text style={[styles.weekTitle, { color: colors.text }]} numberOfLines={1}>
            {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -{' '}
            {weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigateWeek('next')}
          disabled={!canNavigateForward}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons
            name="chevron-forward"
            size={20}
            color={canNavigateForward ? colors.primary : colors.secondary}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.weekGrid}>
        {weekDates.map((date, index) => {
          const isTodayDate = isToday(date);
          const isSelectedDate =
            selectedDate && date.toDateString() === selectedDate.toDateString();
          const dayName = dayNames[index];

          return (
            <TouchableOpacity
              key={`${date.toISOString()}-${index}`}
              style={styles.dayCell}
              onPress={() => onDatePress?.(date)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.dayName,
                  {
                    color: isSelectedDate ? colors.text : colors.secondary,
                    fontWeight: isTodayDate ? 'bold' : 'normal',
                  },
                ]}
              >
                {dayName}
              </Text>

              <View
                style={[
                  styles.dayCircle,
                  {
                    backgroundColor: isSelectedDate ? colors.primary : colors.card,
                    borderColor: isTodayDate ? colors.primary : colors.border,
                    borderWidth: isTodayDate ? 2 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dayNumber,
                    {
                      color: isSelectedDate ? 'white' : isTodayDate ? colors.primary : colors.text,
                      fontWeight: isTodayDate ? 'bold' : 'normal',
                    },
                  ]}
                >
                  {date.getDate()}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  navButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  weekTitleButton: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  weekTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  weekGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  dayName: {
    fontSize: 11,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: {
    fontSize: 16,
  },
});
