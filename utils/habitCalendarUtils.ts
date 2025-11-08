import { Habit } from '@/context/HabitsContext';

/**
 * Calculate completion percentage for habits on a specific date
 * For now, we'll use current completion status
 * In the future, you might want to track daily habit completion history
 */
export function getHabitCompletionForDate(habits: Habit[], date: Date): number {
  if (habits.length === 0) {
    return 0;
  }
  
  // For now, use current completion status
  // TODO: In the future, implement daily habit completion tracking
  const today = new Date();
  const isToday = date.getDate() === today.getDate() && 
                  date.getMonth() === today.getMonth() && 
                  date.getFullYear() === today.getFullYear();
  
  if (!isToday) {
    // For past/future dates, you might want to check completion history
    // For now, return 0 for non-today dates
    return 0;
  }
  
  const completedCount = habits.filter(habit => habit.completed).length;
  return (completedCount / habits.length) * 100;
}

/**
 * Get the current month's completion statistics based on habits
 */
export function getHabitMonthStats(habits: Habit[], year: number, month: number): {
  averageCompletion: number;
  bestDay: number;
  totalHabits: number;
  daysWithData: number;
} {
  const today = new Date();
  const isCurrentMonth = today.getMonth() === month - 1 && today.getFullYear() === year;
  
  // For now, calculate based on current completion
  // In the future, you'd aggregate daily completion data
  const totalHabits = habits.length;
  const completedHabits = habits.filter(habit => habit.completed).length;
  const currentPercentage = totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0;
  
  return {
    averageCompletion: isCurrentMonth ? currentPercentage : 0,
    bestDay: isCurrentMonth ? currentPercentage : 0,
    totalHabits,
    daysWithData: isCurrentMonth && totalHabits > 0 ? 1 : 0,
  };
}


