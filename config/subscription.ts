export const FREE_HABIT_LIMIT = 3;

/** Accent keys available without Mindful Moves Pro */
export const FREE_ACCENT_COLORS = ['blue'] as const;

export type FreeAccentColor = (typeof FREE_ACCENT_COLORS)[number];

export function isFreeAccentColor(color: string): boolean {
  return (FREE_ACCENT_COLORS as readonly string[]).includes(color);
}

export function canAddHabit(isPro: boolean, habitCount: number, isAdmin = false): boolean {
  if (isPro || isAdmin) return true;
  return habitCount < FREE_HABIT_LIMIT;
}
