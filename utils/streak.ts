export interface StreakHabit {
  completionDates?: string[];
}

export interface WeekStreakDay {
  label: string;
  completed: boolean;
}

const WEEKDAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] as const;

const normalizeDateToDay = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00');
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const collectActiveCompletionDays = (habits: StreakHabit[]): Set<string> => {
  const activeDays = new Set<string>();
  habits.forEach((habit) => {
    (habit.completionDates || []).forEach((dateStr) => {
      if (dateStr && typeof dateStr === 'string') {
        activeDays.add(normalizeDateToDay(dateStr));
      }
    });
  });
  return activeDays;
};

export const calculateLongestStreak = (habits: StreakHabit[]): number => {
  if (!habits || habits.length === 0) {
    return 0;
  }

  const uniqueDates = Array.from(collectActiveCompletionDays(habits)).sort();

  if (uniqueDates.length === 0) {
    return 0;
  }

  let longestStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < uniqueDates.length; i++) {
    const currentDate = new Date(uniqueDates[i] + 'T00:00:00');
    const previousDate = new Date(uniqueDates[i - 1] + 'T00:00:00');
    const diffDays = Math.floor(
      (currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 1) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return longestStreak;
};

/**
 * Active global streak: consecutive days (ending today or yesterday) where at least
 * one habit was completed. Breaks on any calendar day with zero completions.
 * If today has no completions yet, yesterday still counts (grace until end of day).
 */
export const calculateCurrentStreak = (habits: StreakHabit[]): number => {
  if (!habits || habits.length === 0) {
    return 0;
  }

  const activeDays = collectActiveCompletionDays(habits);
  if (activeDays.size === 0) {
    return 0;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let cursor = new Date(today);

  if (!activeDays.has(formatLocalDate(today))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const dateStr = formatLocalDate(cursor);
    if (activeDays.has(dateStr)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
};

/**
 * Builds Mon–Sun week strip data for the current calendar week.
 * A day is completed when at least one habit was done that day.
 * Future days in the week are always marked incomplete.
 */
export const buildWeekStreakData = (habits: StreakHabit[]): WeekStreakDay[] => {
  const activeDays = collectActiveCompletionDays(habits);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

  return WEEKDAY_LABELS.map((label, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const isFuture = date > today;
    const completed = !isFuture && activeDays.has(formatLocalDate(date));
    return { label, completed };
  });
};
