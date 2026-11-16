/**
 * Daily reminder rules.
 *
 * Daily Reminders is the only on/off switch. On means three fixed nudges.
 * A custom reminder is a fourth notification, never a replacement.
 * Off means nothing is scheduled, even if a custom time is saved.
 *
 * Upgrade strategy for the previous single reminder (`daily-habit-reminder`):
 * the on/off flag lived only on the device, while `users.reminder_time`
 * defaults to 08:00 for every account. A saved time is therefore not treated
 * as opt-in. Only a scheduled legacy notification migrates to
 * reminders on + custom reminder on, at that saved time. Those people then
 * receive the three built-in nudges as well, because Daily Reminders on
 * always includes them. The legacy notification is cancelled in the same
 * pass so it is not added on top. Accounts that were off stay off.
 */

export const LEGACY_REMINDER_ID = 'daily-habit-reminder';

export const BUILTIN_NUDGES = [
  { id: 'mindful-moves-nudge-morning', slot: 'morning', label: 'Morning', hour: 9, minute: 0 },
  { id: 'mindful-moves-nudge-afternoon', slot: 'afternoon', label: 'Afternoon', hour: 14, minute: 0 },
  { id: 'mindful-moves-nudge-evening', slot: 'evening', label: 'Evening', hour: 20, minute: 0 },
] as const;

export const CUSTOM_REMINDER_ID = 'mindful-moves-reminder-custom';

export const MANAGED_REMINDER_IDS = [
  ...BUILTIN_NUDGES.map((nudge) => nudge.id),
  CUSTOM_REMINDER_ID,
] as const;

export type ReminderSlot = 'morning' | 'afternoon' | 'evening' | 'custom';

export type ReminderPreferences = {
  remindersEnabled: boolean;
  customReminderEnabled: boolean;
  customReminderTime: string | null;
};

export type PlannedReminder = {
  identifier: string;
  slot: ReminderSlot;
  hour: number;
  minute: number;
  title: string;
  body: string;
};

export type ScheduledSnapshot = {
  identifier: string;
  hour: number | null;
  minute: number | null;
};

export type ReconcileAction =
  | { type: 'cancel'; identifier: string }
  | { type: 'schedule'; reminder: PlannedReminder };

export type StoredReminderRow = {
  remindersEnabled: boolean | null;
  customReminderEnabled: boolean | null;
  customReminderTime: string | null;
  legacyReminderTime: string | null;
};

const COPY: Record<ReminderSlot, { title: string; body: string }[]> = {
  morning: [
    { title: 'Good morning', body: 'Your habits are up. A small start counts.' },
    { title: 'Good morning', body: 'Fresh day, easy win. Your habits saved you a seat.' },
    { title: 'Morning nudge', body: 'One habit now and the day already feels better.' },
    { title: 'Rise and check in', body: 'Your habits are ready when you are.' },
  ],
  afternoon: [
    { title: 'Afternoon check-in', body: 'Still time for a small win on your habits.' },
    { title: 'Midday nudge', body: 'How are those habits going? A check-in takes a second.' },
    { title: 'Afternoon nudge', body: 'The middle of the day is a great time to tick one off.' },
    { title: 'Hey, it\'s the afternoon', body: 'Your habits are still here, cheering quietly.' },
  ],
  evening: [
    { title: 'Evening nudge', body: 'Before the day winds down, your habits would love a visit.' },
    { title: 'Evening check-in', body: 'A few habits can still make today feel complete.' },
    { title: 'Day\'s not over', body: 'There is still time to check in with your habits.' },
    { title: 'Evening nudge', body: 'Soft landing for the day: one habit, then you\'re golden.' },
  ],
  custom: [
    { title: 'Your reminder', body: 'This is the nudge you picked. Your habits are ready.' },
    { title: 'Your reminder', body: 'Right on time. A habit check-in fits right here.' },
    { title: 'Extra nudge', body: 'You asked for this one. Your habits are waiting.' },
    { title: 'Your reminder', body: 'Custom time, same friendly poke. Go get a habit.' },
  ],
};

export function normalizeTime(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(value.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

export function dateToTimeString(date: Date): string {
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

export function timeStringToDate(value: string | null, fallback = '08:00'): Date {
  const time = normalizeTime(value) ?? fallback;
  const [hour, minute] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date;
}

export function formatDisplayTime(value: string | null, fallback = '08:00'): string {
  const time = normalizeTime(value) ?? fallback;
  const [hour, minute] = time.split(':').map(Number);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${suffix}`;
}

export function formatClock(hour: number, minute: number): string {
  return formatDisplayTime(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
}

export function reminderCopy(slot: ReminderSlot, seed = 0): { title: string; body: string } {
  const options = COPY[slot];
  const index = ((seed % options.length) + options.length) % options.length;
  return options[index];
}

export function copySeedForDate(date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - start.getTime()) / 86_400_000);
}

export function desiredReminders(prefs: ReminderPreferences, copySeed = 0): PlannedReminder[] {
  if (!prefs.remindersEnabled) return [];

  const planned: PlannedReminder[] = BUILTIN_NUDGES.map((nudge) => {
    const copy = reminderCopy(nudge.slot, copySeed);
    return {
      identifier: nudge.id,
      slot: nudge.slot,
      hour: nudge.hour,
      minute: nudge.minute,
      title: copy.title,
      body: copy.body,
    };
  });

  const customTime = normalizeTime(prefs.customReminderTime);
  if (prefs.customReminderEnabled && customTime) {
    const [hour, minute] = customTime.split(':').map(Number);
    const copy = reminderCopy('custom', copySeed);
    planned.push({
      identifier: CUSTOM_REMINDER_ID,
      slot: 'custom',
      hour,
      minute,
      title: copy.title,
      body: copy.body,
    });
  }

  return planned;
}

export function planReminderReconcile(
  prefs: ReminderPreferences,
  scheduled: ScheduledSnapshot[],
  copySeed = 0,
): ReconcileAction[] {
  const actions: ReconcileAction[] = [];
  const byId = new Map(scheduled.map((item) => [item.identifier, item]));

  if (byId.has(LEGACY_REMINDER_ID)) {
    actions.push({ type: 'cancel', identifier: LEGACY_REMINDER_ID });
  }

  const desired = desiredReminders(prefs, copySeed);
  const desiredById = new Map(desired.map((reminder) => [reminder.identifier, reminder]));

  for (const identifier of MANAGED_REMINDER_IDS) {
    const existing = byId.get(identifier);
    const next = desiredById.get(identifier);

    if (!next && existing) {
      actions.push({ type: 'cancel', identifier });
      continue;
    }

    if (next && !existing) {
      actions.push({ type: 'schedule', reminder: next });
      continue;
    }

    if (next && existing) {
      const timeKnown = existing.hour !== null && existing.minute !== null;
      const timeDiffers = timeKnown && (existing.hour !== next.hour || existing.minute !== next.minute);
      if (timeDiffers) {
        actions.push({ type: 'cancel', identifier });
        actions.push({ type: 'schedule', reminder: next });
      }
    }
  }

  return actions;
}

export function migrateReminderPreferences(
  stored: StoredReminderRow,
  legacyNotificationScheduled: boolean,
): { preferences: ReminderPreferences; didMigrate: boolean } {
  const savedTime = normalizeTime(stored.customReminderTime) ?? normalizeTime(stored.legacyReminderTime);

  if (typeof stored.remindersEnabled === 'boolean') {
    return {
      didMigrate: false,
      preferences: {
        remindersEnabled: stored.remindersEnabled,
        customReminderEnabled: stored.customReminderEnabled === true,
        customReminderTime: savedTime,
      },
    };
  }

  if (legacyNotificationScheduled) {
    return {
      didMigrate: true,
      preferences: {
        remindersEnabled: true,
        customReminderEnabled: true,
        customReminderTime: savedTime ?? '08:00',
      },
    };
  }

  return {
    didMigrate: true,
    preferences: {
      remindersEnabled: false,
      customReminderEnabled: false,
      customReminderTime: savedTime,
    },
  };
}
