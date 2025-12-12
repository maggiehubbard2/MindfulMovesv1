import { useHabits } from '@/context/HabitsContext';
import { useTheme } from '@/context/ThemeContext';
import { getHabitCompletionForDate } from '@/utils/habitCalendarUtils';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface WeeklyCalendarProps {
  onDatePress?: (date: Date) => void;
}

export default function WeeklyCalendar({ onDatePress }: WeeklyCalendarProps) {
  const { colors } = useTheme();
  const { habits } = useHabits();
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day; // Adjust to Sunday
    const sunday = new Date(today.setDate(diff));
    sunday.setHours(0, 0, 0, 0);
    return sunday;
  });

  const getWeekDates = (weekStart: Date): Date[] => {
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeekStart);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentWeekStart(newDate);
  };

  const goToCurrentWeek = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day;
    const sunday = new Date(today.setDate(diff));
    sunday.setHours(0, 0, 0, 0);
    setCurrentWeekStart(sunday);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };

  const getCompletionPercentage = (date: Date): number => {
    // Use the utility function which properly filters habits by creation date
    return getHabitCompletionForDate(habits, date);
  };

  const weekDates = getWeekDates(currentWeekStart);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayNamesFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  // Check if current week is displayed
  const today = new Date();
  const isCurrentWeek = weekDates.some(date => isToday(date));

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      {/* Week Navigation Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigateWeek('prev')}
        >
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={goToCurrentWeek}>
          <Text style={[styles.weekTitle, { color: colors.text }]}>
            {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {' '}
            {weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigateWeek('next')}
        >
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Week Grid */}
      <View style={styles.weekGrid}>
        {weekDates.map((date, index) => {
          const percentage = getCompletionPercentage(date);
          const isTodayDate = isToday(date);
          const dayName = dayNames[index];
          
          return (
            <TouchableOpacity
              key={index}
              style={styles.dayCell}
              onPress={() => onDatePress?.(date)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.dayName,
                { 
                  color: isTodayDate ? colors.text : colors.secondary,
                  fontWeight: isTodayDate ? 'bold' : 'normal'
                }
              ]}>
                {dayName}
              </Text>
              
              <View style={[
                styles.dayCircle,
                { 
                  backgroundColor: isTodayDate ? colors.primary : colors.card,
                  borderColor: isTodayDate ? colors.primary : colors.border,
                }
              ]}>
                <Text style={[
                  styles.dayNumber,
                  { 
                    color: isTodayDate ? 'white' : colors.text,
                    fontWeight: isTodayDate ? 'bold' : 'normal'
                  }
                ]}>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  navButton: {
    padding: 4,
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
