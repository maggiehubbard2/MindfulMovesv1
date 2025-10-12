import { Habit } from '@/context/HabitsContext';
import { Task } from '@/context/TasksContext';

/**
 * Generate array of dates for a calendar grid for the given month
 */
export function getMonthDates(year: number, month: number): Date[] {
  const dates: Date[] = [];
  
  // Get first day of month and last day of month
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  
  // Get the day of week for first day (0 = Sunday, 1 = Monday, etc.)
  const startDayOfWeek = firstDay.getDay();
  
  // Add empty cells for days before the first day of month
  for (let i = 0; i < startDayOfWeek; i++) {
    const date = new Date(firstDay);
    date.setDate(date.getDate() - (startDayOfWeek - i));
    dates.push(date);
  }
  
  // Add all days of the month
  for (let day = 1; day <= lastDay.getDate(); day++) {
    dates.push(new Date(year, month - 1, day));
  }
  
  return dates;
}

/**
 * Filter tasks that are linked to habits
 */
export function filterHabitLinkedTasks(tasks: Task[]): Task[] {
  return tasks.filter(task => task.habitId);
}

/**
 * Check if a date exists in a task's completion dates array
 */
export function isDateInCompletionArray(task: Task, date: Date): boolean {
  const dateStr = date.toISOString().split('T')[0];
  return task.completionDates?.includes(dateStr) || false;
}

/**
 * Get tasks that should be active on a specific date based on frequency
 */
export function getActiveTasksForDate(tasks: Task[], date: Date): Task[] {
  const dateStr = date.toISOString().split('T')[0];
  
  return tasks.filter(task => {
    switch (task.frequency) {
      case 'one-time':
        // Show if not completed today
        return !isDateInCompletionArray(task, date);
      case 'daily':
        // Always show daily tasks
        return true;
      case 'monthly':
        // Show only on matching day of month
        const taskDay = new Date(task.createdAt).getDate();
        return date.getDate() === taskDay;
      default:
        return true;
    }
  });
}

/**
 * Calculate completion percentage for habit-linked tasks on a specific date
 */
export function getTaskCompletionForDate(tasks: Task[], date: Date): number {
  // Filter for tasks that are linked to habits and active on this date
  const habitLinkedTasks = filterHabitLinkedTasks(tasks);
  const activeTasks = getActiveTasksForDate(habitLinkedTasks, date);
  
  if (activeTasks.length === 0) {
    return 0;
  }
  
  // Count completed tasks for this date
  const completedCount = activeTasks.filter(task => 
    isDateInCompletionArray(task, date)
  ).length;
  
  return (completedCount / activeTasks.length) * 100;
}

/**
 * Get detailed breakdown of task completion for a specific date
 */
export function getDailyProgress(tasks: Task[], habits: Habit[], date: Date): {
  completed: number;
  total: number;
  percentage: number;
  habitLinkedTasks: Task[];
} {
  // Filter for tasks that are linked to habits and active on this date
  const habitLinkedTasks = filterHabitLinkedTasks(tasks);
  const activeTasks = getActiveTasksForDate(habitLinkedTasks, date);
  
  const completed = activeTasks.filter(task => 
    isDateInCompletionArray(task, date)
  ).length;
  
  const total = activeTasks.length;
  const percentage = total > 0 ? (completed / total) * 100 : 0;
  
  return {
    completed,
    total,
    percentage,
    habitLinkedTasks: activeTasks
  };
}

/**
 * Get the current month's completion statistics
 */
export function getMonthStats(tasks: Task[], year: number, month: number): {
  averageCompletion: number;
  bestDay: number;
  totalHabitTasks: number;
  daysWithData: number;
} {
  const habitLinkedTasks = filterHabitLinkedTasks(tasks);
  const dates = getMonthDates(year, month);
  
  // Filter to only actual days of the month (not empty cells)
  const monthDates = dates.filter(date => date.getMonth() === month - 1);
  
  const dailyPercentages = monthDates.map(date => 
    getTaskCompletionForDate(tasks, date)
  );
  
  const averageCompletion = dailyPercentages.length > 0 
    ? dailyPercentages.reduce((sum, pct) => sum + pct, 0) / dailyPercentages.length 
    : 0;
  
  const bestDay = Math.max(...dailyPercentages, 0);
  
  const daysWithData = dailyPercentages.filter(pct => pct > 0).length;
  
  return {
    averageCompletion,
    bestDay,
    totalHabitTasks: habitLinkedTasks.length,
    daysWithData
  };
}
