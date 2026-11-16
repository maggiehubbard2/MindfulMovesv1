-- Unified reminder preferences.
-- Built-in nudge times (9:00, 14:00, 20:00) stay in the app. They are not columns.
-- Booleans are left NULL until the app migrates a row. NULL means "not migrated".
-- Do not backfill reminders_enabled from reminder_time: that column defaults to
-- 08:00 for every user, including people who never turned a reminder on.
-- The app turns reminders on only when the old daily-habit-reminder notification
-- is still scheduled on the device, and it keeps that time as the custom reminder.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS reminders_enabled BOOLEAN,
  ADD COLUMN IF NOT EXISTS custom_reminder_enabled BOOLEAN,
  ADD COLUMN IF NOT EXISTS custom_reminder_time TEXT;

UPDATE users
SET custom_reminder_time = reminder_time
WHERE custom_reminder_time IS NULL
  AND reminder_time IS NOT NULL
  AND btrim(reminder_time) <> '';
