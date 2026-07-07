/**
 * Format a Date as local calendar day YYYY-MM-DD (avoids UTC shift from toISOString).
 */
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayDateString(): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return formatLocalDate(today);
}

/** Returns Sunday 00:00:00 local time for the week containing `date`. */
export function getWeekStartSunday(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

export function isSameCalendarDay(a: Date, b: Date): boolean {
  return formatLocalDate(a) === formatLocalDate(b);
}

export function isSameWeek(a: Date, b: Date): boolean {
  return getWeekStartSunday(a).getTime() === getWeekStartSunday(b).getTime();
}
