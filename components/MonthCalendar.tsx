import { useHabits } from '@/context/HabitsContext';
import { useTheme } from '@/context/ThemeContext';
import { getMonthDates } from '@/utils/calendarUtils';
import { getHabitCompletionForDate, getHabitMonthStats } from '@/utils/habitCalendarUtils';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ProgressCircle from './ProgressCircle';

interface MonthCalendarProps {
  onDatePress?: (date: Date) => void;
}

export default function MonthCalendar({ onDatePress }: MonthCalendarProps) {
  const { colors } = useTheme();
  const { habits } = useHabits();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11
  
  const monthDates = getMonthDates(currentYear, currentMonth);
  const monthStats = getHabitMonthStats(habits, currentYear, currentMonth);
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };
  
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth - 1 && date.getFullYear() === currentYear;
  };
  
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };
  
  const getCompletionPercentage = (date: Date) => {
    if (!isCurrentMonth(date)) return 0;
    return getHabitCompletionForDate(habits, date);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigateMonth('prev')}
        >
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        
        <Text style={[styles.monthTitle, { color: colors.text }]}>
          {monthNames[currentMonth - 1]} {currentYear}
        </Text>
        
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigateMonth('next')}
        >
          <Ionicons name="chevron-forward" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Month Stats */}
      <View style={[styles.statsContainer, { backgroundColor: colors.card }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {Math.round(monthStats.averageCompletion)}%
          </Text>
          <Text style={[styles.statLabel, { color: colors.secondary }]}>
            Average
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {Math.round(monthStats.bestDay)}%
          </Text>
          <Text style={[styles.statLabel, { color: colors.secondary }]}>
            Best Day
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {monthStats.totalHabits}
          </Text>
          <Text style={[styles.statLabel, { color: colors.secondary }]}>
            Goals
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {monthStats.daysWithData}
          </Text>
          <Text style={[styles.statLabel, { color: colors.secondary }]}>
            Active Days
          </Text>
        </View>
      </View>

      {/* Day Headers */}
      <View style={styles.dayHeaders}>
        {dayNames.map(day => (
          <Text key={day} style={[styles.dayHeader, { color: colors.secondary }]}>
            {day}
          </Text>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {monthDates.map((date, index) => {
          const percentage = getCompletionPercentage(date);
          const isCurrentMonthDate = isCurrentMonth(date);
          const isTodayDate = isToday(date);
          
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dateCell,
                { 
                  backgroundColor: isCurrentMonthDate ? 'transparent' : colors.background,
                  borderColor: colors.border,
                },
                isTodayDate && { backgroundColor: colors.primary + '20' }
              ]}
              onPress={() => isCurrentMonthDate && onDatePress?.(date)}
              disabled={!isCurrentMonthDate}
            >
              <Text style={[
                styles.dateText,
                { 
                  color: isCurrentMonthDate ? colors.text : colors.secondary,
                  fontWeight: isTodayDate ? 'bold' : 'normal'
                }
              ]}>
                {date.getDate()}
              </Text>
              
              {isCurrentMonthDate && (
                <ProgressCircle
                  percentage={percentage}
                  size={28}
                  strokeWidth={2}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Legend */}
      <View style={[styles.legend, { backgroundColor: colors.card }]}>
        <Text style={[styles.legendTitle, { color: colors.text }]}>Progress Legend</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <ProgressCircle percentage={0} size={16} strokeWidth={2} />
            <Text style={[styles.legendText, { color: colors.secondary }]}>0%</Text>
          </View>
          <View style={styles.legendItem}>
            <ProgressCircle percentage={33} size={16} strokeWidth={2} />
            <Text style={[styles.legendText, { color: colors.secondary }]}>33%</Text>
          </View>
          <View style={styles.legendItem}>
            <ProgressCircle percentage={66} size={16} strokeWidth={2} />
            <Text style={[styles.legendText, { color: colors.secondary }]}>66%</Text>
          </View>
          <View style={styles.legendItem}>
            <ProgressCircle percentage={100} size={16} strokeWidth={2} />
            <Text style={[styles.legendText, { color: colors.secondary }]}>100%</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  navButton: {
    padding: 8,
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  dayHeaders: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  dateCell: {
    width: '14.28%', // 100% / 7 days
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    position: 'relative',
  },
  dateText: {
    fontSize: 14,
    marginBottom: 4,
  },
  legend: {
    padding: 16,
    marginTop: 16,
    borderRadius: 8,
    marginHorizontal: 16,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  legendItems: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    alignItems: 'center',
  },
  legendText: {
    fontSize: 12,
    marginTop: 4,
  },
});
