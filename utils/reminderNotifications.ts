import { supabase } from '@/config/supabase';
import {
  copySeedForDate,
  dateToTimeString,
  LEGACY_REMINDER_ID,
  migrateReminderPreferences,
  normalizeTime,
  planReminderReconcile,
  type PlannedReminder,
  type ReminderPreferences,
  type ScheduledSnapshot,
} from '@/utils/reminderSchedule';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const CACHE_KEY = 'reminderPreferences';
const LEGACY_TIME_KEY = 'reminderTime';

type CachedPreferences = ReminderPreferences & { migrated?: boolean };

type DbReminderRow = {
  reminder_time: string | null;
  reminders_enabled: boolean | null;
  custom_reminder_enabled: boolean | null;
  custom_reminder_time: string | null;
};

export type ReminderUpdateResult = {
  ok: boolean;
  reason?: 'permission' | 'error';
  preferences: ReminderPreferences;
};

const EMPTY_PREFS: ReminderPreferences = {
  remindersEnabled: false,
  customReminderEnabled: false,
  customReminderTime: null,
};

try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch {
  // Notifications are unavailable on some platforms.
}

let queue: Promise<unknown> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.then(() => undefined, () => undefined);
  return run;
}

async function readCache(): Promise<CachedPreferences | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedPreferences;
    return {
      remindersEnabled: parsed.remindersEnabled === true,
      customReminderEnabled: parsed.customReminderEnabled === true,
      customReminderTime: normalizeTime(parsed.customReminderTime),
      migrated: parsed.migrated === true,
    };
  } catch {
    return null;
  }
}

async function readLegacyCachedTime(): Promise<string | null> {
  try {
    return normalizeTime(await AsyncStorage.getItem(LEGACY_TIME_KEY));
  } catch {
    return null;
  }
}

async function writeCache(prefs: ReminderPreferences): Promise<void> {
  const payload: CachedPreferences = { ...prefs, migrated: true };
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  if (prefs.customReminderTime) {
    await AsyncStorage.setItem(LEGACY_TIME_KEY, prefs.customReminderTime);
  }
}

function isMissingColumn(error: { code?: string } | null): boolean {
  return error?.code === '42703' || error?.code === 'PGRST204';
}

async function readDb(userId: string): Promise<DbReminderRow | null> {
  const full = await supabase
    .from('users')
    .select('reminder_time, reminders_enabled, custom_reminder_enabled, custom_reminder_time')
    .eq('id', userId)
    .single();

  if (!full.error) {
    return {
      reminder_time: full.data?.reminder_time ?? null,
      reminders_enabled: typeof full.data?.reminders_enabled === 'boolean' ? full.data.reminders_enabled : null,
      custom_reminder_enabled: typeof full.data?.custom_reminder_enabled === 'boolean'
        ? full.data.custom_reminder_enabled
        : null,
      custom_reminder_time: full.data?.custom_reminder_time ?? null,
    };
  }

  if (!isMissingColumn(full.error)) {
    if (__DEV__) console.warn('[reminders] Could not read reminder preferences:', full.error.message);
    return null;
  }

  const legacy = await supabase
    .from('users')
    .select('reminder_time')
    .eq('id', userId)
    .single();

  if (legacy.error) return null;
  return {
    reminder_time: legacy.data?.reminder_time ?? null,
    reminders_enabled: null,
    custom_reminder_enabled: null,
    custom_reminder_time: null,
  };
}

async function writeDb(userId: string, prefs: ReminderPreferences): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({
      reminders_enabled: prefs.remindersEnabled,
      custom_reminder_enabled: prefs.customReminderEnabled,
      custom_reminder_time: prefs.customReminderTime,
    })
    .eq('id', userId);

  if (error && !isMissingColumn(error) && __DEV__) {
    console.warn('[reminders] Could not save reminder preferences:', error.message);
  }
}

async function readScheduled(): Promise<ScheduledSnapshot[]> {
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    return notifications.map((notification) => {
      const trigger = notification.trigger as { hour?: number; minute?: number } | null;
      const hour = typeof trigger?.hour === 'number' ? trigger.hour : null;
      const minute = typeof trigger?.minute === 'number' ? trigger.minute : null;
      return { identifier: notification.identifier, hour, minute };
    });
  } catch {
    return [];
  }
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'default',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
  });
}

async function applyReminder(reminder: PlannedReminder): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    identifier: reminder.identifier,
    content: {
      title: reminder.title,
      body: reminder.body,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      channelId: 'default',
      hour: reminder.hour,
      minute: reminder.minute,
    },
  });
}

async function cancelReminder(identifier: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch {
    // Already gone, or this platform cannot cancel by id.
  }
}

async function applyPlan(prefs: ReminderPreferences, scheduled: ScheduledSnapshot[]): Promise<void> {
  const actions = planReminderReconcile(prefs, scheduled, copySeedForDate());
  if (actions.length === 0) return;
  await ensureAndroidChannel();
  for (const action of actions) {
    if (action.type === 'cancel') {
      await cancelReminder(action.identifier);
    } else {
      try {
        await applyReminder(action.reminder);
      } catch (error) {
        if (__DEV__) console.warn('[reminders] Could not schedule', action.reminder.identifier, error);
      }
    }
  }
}

async function resolvePreferences(userId: string): Promise<{
  prefs: ReminderPreferences;
  scheduled: ScheduledSnapshot[];
  db: DbReminderRow | null;
}> {
  const [cache, db, legacyCachedTime, scheduled] = await Promise.all([
    readCache(),
    readDb(userId),
    readLegacyCachedTime(),
    readScheduled(),
  ]);

  const legacyScheduled = scheduled.some((item) => item.identifier === LEGACY_REMINDER_ID);
  const dbKnowsEnabled = db !== null && typeof db.reminders_enabled === 'boolean';

  let prefs: ReminderPreferences;
  if (dbKnowsEnabled && db) {
    const migrated = migrateReminderPreferences({
      remindersEnabled: db.reminders_enabled,
      customReminderEnabled: db.custom_reminder_enabled,
      customReminderTime: db.custom_reminder_time,
      legacyReminderTime: db.reminder_time ?? legacyCachedTime,
    }, legacyScheduled);
    prefs = migrated.preferences;
  } else if (cache?.migrated) {
    prefs = {
      remindersEnabled: cache.remindersEnabled,
      customReminderEnabled: cache.customReminderEnabled,
      customReminderTime: cache.customReminderTime ?? legacyCachedTime,
    };
  } else {
    const migrated = migrateReminderPreferences({
      remindersEnabled: null,
      customReminderEnabled: null,
      customReminderTime: null,
      legacyReminderTime: db?.reminder_time ?? legacyCachedTime,
    }, legacyScheduled);
    prefs = migrated.preferences;
  }

  return { prefs, scheduled, db };
}

async function commit(userId: string, prefs: ReminderPreferences, scheduled?: ScheduledSnapshot[]): Promise<ReminderPreferences> {
  const current = scheduled ?? await readScheduled();
  await writeCache(prefs);
  await writeDb(userId, prefs);
  await applyPlan(prefs, current);
  return prefs;
}

export function ensureReminderPreferences(userId: string): Promise<ReminderPreferences> {
  return enqueue(async () => {
    const [{ prefs, scheduled, db }, cache] = await Promise.all([
      resolvePreferences(userId),
      readCache(),
    ]);
    const actions = planReminderReconcile(prefs, scheduled, copySeedForDate());
    const cacheMatches = cache?.migrated === true
      && cache.remindersEnabled === prefs.remindersEnabled
      && cache.customReminderEnabled === prefs.customReminderEnabled
      && cache.customReminderTime === prefs.customReminderTime;
    if (actions.length === 0 && cacheMatches) {
      if (db && db.reminders_enabled === null) await writeDb(userId, prefs);
      return prefs;
    }
    return commit(userId, prefs, scheduled);
  });
}

async function requestReminderPermission(): Promise<boolean> {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return false;
    await ensureAndroidChannel();
    return true;
  } catch {
    return false;
  }
}

export function setDailyRemindersEnabled(userId: string, enabled: boolean): Promise<ReminderUpdateResult> {
  return enqueue(async () => {
    const { prefs, scheduled } = await resolvePreferences(userId);
    if (enabled) {
      const allowed = await requestReminderPermission();
      if (!allowed) {
        return { ok: false, reason: 'permission', preferences: prefs };
      }
    }
    const next = { ...prefs, remindersEnabled: enabled };
    const saved = await commit(userId, next, scheduled);
    return { ok: true, preferences: saved };
  });
}

export function setCustomReminderEnabled(userId: string, enabled: boolean): Promise<ReminderPreferences> {
  return enqueue(async () => {
    const { prefs, scheduled } = await resolvePreferences(userId);
    const next: ReminderPreferences = {
      ...prefs,
      customReminderEnabled: enabled,
      customReminderTime: enabled ? (prefs.customReminderTime ?? '08:00') : prefs.customReminderTime,
    };
    return commit(userId, next, scheduled);
  });
}

export function setCustomReminderTime(userId: string, time: string): Promise<ReminderPreferences> {
  return enqueue(async () => {
    const normalized = normalizeTime(time) ?? dateToTimeString(new Date());
    const { prefs, scheduled } = await resolvePreferences(userId);
    const next = { ...prefs, customReminderTime: normalized };
    return commit(userId, next, scheduled);
  });
}

export function reminderSummary(prefs: ReminderPreferences): string {
  if (!prefs.remindersEnabled) {
    return 'Enable/disable reminders.';
  }
  const customTime = prefs.customReminderEnabled ? normalizeTime(prefs.customReminderTime) : null;
  if (customTime) {
    return `Morning, afternoon, and evening nudges are on, plus your extra reminder.`;
  }
  return 'Morning, afternoon, and evening nudges are on.';
}

export { EMPTY_PREFS };
