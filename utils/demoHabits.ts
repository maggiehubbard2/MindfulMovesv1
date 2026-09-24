import type { Habit } from '@/context/HabitsContext';
import { formatLocalDate } from '@/utils/date';

const DEMO_HABITS: { id: string; name: string; description: string }[] = [
  { id: 'demo-meditation', name: 'Morning meditation', description: '10 quiet minutes' },
  { id: 'demo-water', name: 'Drink water', description: 'A glass with every meal' },
  { id: 'demo-walk', name: 'Evening walk', description: '20 minutes outside' },
  { id: 'demo-read', name: 'Read', description: '10 pages' },
  { id: 'demo-stretch', name: 'Stretch', description: '5 minutes on the floor' },
];

/** Today stays partly open so the dashboard list is not all crossed out. */
const TODAY_COMPLETE = new Set([0, 1, 3]);
/** The lighter calendar day: showed up, but only for two habits. */
const OFF_DAY_COMPLETE = new Set([0, 1]);

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/**
 * One lighter day, kept inside the current month when that still leaves
 * yesterday free to show as a full catch-up day.
 */
function resolveOffDay(today: Date, monthStart: Date): Date {
  const yesterday = addDays(today, -1);
  let offDay = addDays(today, -8);

  if (offDay < monthStart) {
    const latestOff = addDays(today, -2);
    if (latestOff >= monthStart) {
      offDay = monthStart.getTime() < latestOff.getTime() ? new Date(monthStart) : latestOff;
    }
  }

  const offKey = formatLocalDate(offDay);
  if (offKey === formatLocalDate(today) || offKey === formatLocalDate(yesterday)) {
    return addDays(today, -8);
  }

  return offDay;
}

function isCompletedOn(
  habitIndex: number,
  day: Date,
  today: Date,
  yesterday: Date,
  offDay: Date,
  comebackDay: Date
): boolean {
  const key = formatLocalDate(day);
  if (key === formatLocalDate(today)) return TODAY_COMPLETE.has(habitIndex);
  if (key === formatLocalDate(yesterday)) return true;
  if (key === formatLocalDate(offDay)) return OFF_DAY_COMPLETE.has(habitIndex);
  if (key === formatLocalDate(comebackDay)) return true;
  return habitIndex !== day.getDate() % DEMO_HABITS.length;
}

/**
 * Five habits with a ~80% month, a 40% off day, a full comeback the next day,
 * yesterday fully done, and today 3/5. Every seeded day has at least one
 * completion, so the streak is not broken.
 */
export function buildDemoHabits(userId: string, now: Date = new Date()): Habit[] {
  const today = startOfDay(now);
  const yesterday = addDays(today, -1);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const streakStart = addDays(today, -22);
  const rangeStart = streakStart.getTime() < monthStart.getTime() ? streakStart : monthStart;
  const offDay = resolveOffDay(today, monthStart);
  const comebackDay = addDays(offDay, 1);
  const createdAt = addDays(rangeStart, -1);

  return DEMO_HABITS.map((definition, habitIndex) => {
    const completionDates: string[] = [];
    const cursor = new Date(rangeStart);

    while (cursor.getTime() <= today.getTime()) {
      if (isCompletedOn(habitIndex, cursor, today, yesterday, offDay, comebackDay)) {
        completionDates.push(formatLocalDate(cursor));
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    const todayKey = formatLocalDate(today);
    return {
      id: definition.id,
      name: definition.name,
      description: definition.description,
      completed: completionDates.includes(todayKey),
      userId,
      createdAt,
      completionDates,
    };
  });
}
