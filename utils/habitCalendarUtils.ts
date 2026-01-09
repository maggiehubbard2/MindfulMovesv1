import { Habit } from '@/context/HabitsContext';

/**
 * Calculate completion percentage for habits on a specific date
 * Uses historical completion data from completionDates array
 * Only includes habits that existed on or before the target date
 */
export function getHabitCompletionForDate(habits: Habit[], date: Date): number {
  if (habits.length === 0) {
    return 0;
  }
  
  const dateStr = date.toISOString().split('T')[0];
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  
  // Filter to only include habits that were created on or before the target date
  const habitsThatExisted = habits.filter(habit => {
    const createdAt = new Date(habit.createdAt);
    createdAt.setHours(0, 0, 0, 0);
    return createdAt <= targetDate;
  });
  
  if (habitsThatExisted.length === 0) {
    return 0;
  }
  
  // Count habits that were completed on this specific date
  const completedCount = habitsThatExisted.filter(habit => {
    const completionDates = habit.completionDates || [];
    return completionDates.includes(dateStr);
  }).length;
  
  return (completedCount / habitsThatExisted.length) * 100;
}

/**
 * Get the current month's completion statistics based on habits
 * Uses historical completion data from completionDates array
 * Only includes habits that existed on each respective date
 * Only counts days up to today (excludes future dates)
 */
export function getHabitMonthStats(habits: Habit[], year: number, month: number): {
  averageCompletion: number;
  bestDay: number;
  totalHabits: number;
  daysWithData: number;
} {
  if (habits.length === 0) {
    return {
      averageCompletion: 0,
      bestDay: 0,
      totalHabits: 0,
      daysWithData: 0,
    };
  }
  
  // Get all dates in the month
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const monthDates: Date[] = [];
  
  for (let day = 1; day <= lastDay.getDate(); day++) {
    monthDates.push(new Date(year, month - 1, day));
  }
  
  // Get today's date (normalized to start of day for comparison)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Filter out future dates - only include days up to today
  const datesUpToToday = monthDates.filter(date => {
    const dateNormalized = new Date(date);
    dateNormalized.setHours(0, 0, 0, 0);
    return dateNormalized <= today;
  });
  
  // If no dates up to today (viewing future month), return zeros
  if (datesUpToToday.length === 0) {
    return {
      averageCompletion: 0,
      bestDay: 0,
      totalHabits: habits.length,
      daysWithData: 0,
    };
  }
  
  // Calculate completion percentage for each day up to today
  // Each day will only count habits that existed on that date
  const dailyPercentages = datesUpToToday.map(date => 
    getHabitCompletionForDate(habits, date)
  );
  
  // Calculate statistics
  const daysWithData = dailyPercentages.filter(pct => pct > 0).length;
  const averageCompletion = dailyPercentages.length > 0
    ? dailyPercentages.reduce((sum, pct) => sum + pct, 0) / dailyPercentages.length
    : 0;
  const bestDay = Math.max(...dailyPercentages, 0);
  
  // Total habits is the count of all habits (for display purposes)
  // Note: This represents current total, not historical
  const totalHabits = habits.length;
  
  return {
    averageCompletion,
    bestDay,
    totalHabits,
    daysWithData,
  };
}


