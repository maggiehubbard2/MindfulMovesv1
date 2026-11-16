import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BUILTIN_NUDGES,
  CUSTOM_REMINDER_ID,
  LEGACY_REMINDER_ID,
  desiredReminders,
  migrateReminderPreferences,
  planReminderReconcile,
  reminderCopy,
  type ReminderPreferences,
  type ScheduledSnapshot,
} from './reminderSchedule.ts';

const off: ReminderPreferences = {
  remindersEnabled: false,
  customReminderEnabled: false,
  customReminderTime: null,
};

const nudgesOn: ReminderPreferences = {
  remindersEnabled: true,
  customReminderEnabled: false,
  customReminderTime: null,
};

const bothOn: ReminderPreferences = {
  remindersEnabled: true,
  customReminderEnabled: true,
  customReminderTime: '07:30',
};

function ids(prefs: ReminderPreferences): string[] {
  return desiredReminders(prefs, 0).map((reminder) => reminder.identifier);
}

test('daily reminders off schedules nothing, even with a custom time saved', () => {
  assert.deepEqual(ids({ ...off, customReminderEnabled: true, customReminderTime: '06:15' }), []);
});

test('daily reminders on schedules exactly the three built-in nudges', () => {
  const planned = desiredReminders(nudgesOn, 0);
  assert.deepEqual(
    planned.map((reminder) => [reminder.identifier, reminder.hour, reminder.minute]),
    BUILTIN_NUDGES.map((nudge) => [nudge.id, nudge.hour, nudge.minute]),
  );
  assert.equal(planned.length, 3);
});

test('a custom reminder is a fourth notification at the chosen time', () => {
  const planned = desiredReminders(bothOn, 0);
  assert.equal(planned.length, 4);
  const custom = planned.find((reminder) => reminder.identifier === CUSTOM_REMINDER_ID);
  assert.equal(custom?.hour, 7);
  assert.equal(custom?.minute, 30);
  assert.ok(reminderCopy('custom', 0).body.length > 0);
  assert.notEqual(planned[0].body, planned[1].body);
});

test('enabling daily reminders from an empty schedule creates three nudges', () => {
  const actions = planReminderReconcile(nudgesOn, []);
  assert.deepEqual(
    actions.map((action) => action.type === 'schedule' ? action.reminder.identifier : action.identifier),
    BUILTIN_NUDGES.map((nudge) => nudge.id),
  );
});

test('adding a custom reminder leaves the three nudges in place', () => {
  const scheduled: ScheduledSnapshot[] = BUILTIN_NUDGES.map((nudge) => ({
    identifier: nudge.id,
    hour: nudge.hour,
    minute: nudge.minute,
  }));
  const actions = planReminderReconcile(bothOn, scheduled);
  assert.deepEqual(actions, [
    {
      type: 'schedule',
      reminder: desiredReminders(bothOn, 0).find((reminder) => reminder.slot === 'custom'),
    },
  ]);
});

test('changing the custom time updates only the custom notification', () => {
  const scheduled: ScheduledSnapshot[] = [
    ...BUILTIN_NUDGES.map((nudge) => ({
      identifier: nudge.id,
      hour: nudge.hour,
      minute: nudge.minute,
    })),
    { identifier: CUSTOM_REMINDER_ID, hour: 7, minute: 30 },
  ];
  const next: ReminderPreferences = { ...bothOn, customReminderTime: '18:45' };
  const actions = planReminderReconcile(next, scheduled);
  assert.deepEqual(
    actions.map((action) => action.type === 'cancel' ? `cancel:${action.identifier}` : `schedule:${action.reminder.identifier}`),
    [`cancel:${CUSTOM_REMINDER_ID}`, `schedule:${CUSTOM_REMINDER_ID}`],
  );
  const scheduledNext = actions.find((action) => action.type === 'schedule');
  assert.equal(scheduledNext?.type === 'schedule' && scheduledNext.reminder.hour, 18);
  assert.equal(scheduledNext?.type === 'schedule' && scheduledNext.reminder.minute, 45);
});

test('disabling the custom reminder leaves the three nudges intact', () => {
  const scheduled: ScheduledSnapshot[] = [
    ...BUILTIN_NUDGES.map((nudge) => ({
      identifier: nudge.id,
      hour: nudge.hour,
      minute: nudge.minute,
    })),
    { identifier: CUSTOM_REMINDER_ID, hour: 7, minute: 30 },
  ];
  const actions = planReminderReconcile(
    { remindersEnabled: true, customReminderEnabled: false, customReminderTime: '07:30' },
    scheduled,
  );
  assert.deepEqual(actions, [{ type: 'cancel', identifier: CUSTOM_REMINDER_ID }]);
});

test('disabling daily reminders cancels every managed notification', () => {
  const scheduled: ScheduledSnapshot[] = [
    ...BUILTIN_NUDGES.map((nudge) => ({
      identifier: nudge.id,
      hour: nudge.hour,
      minute: nudge.minute,
    })),
    { identifier: CUSTOM_REMINDER_ID, hour: 7, minute: 30 },
  ];
  const actions = planReminderReconcile(
    { remindersEnabled: false, customReminderEnabled: true, customReminderTime: '07:30' },
    scheduled,
  );
  assert.deepEqual(
    actions.map((action) => action.type === 'cancel' ? action.identifier : ''),
    [...BUILTIN_NUDGES.map((nudge) => nudge.id), CUSTOM_REMINDER_ID],
  );
});

test('re-enabling restores nudges and a previously enabled custom reminder', () => {
  const actions = planReminderReconcile(bothOn, []);
  assert.equal(actions.length, 4);
  assert.ok(actions.every((action) => action.type === 'schedule'));
});

test('a restart with the correct schedule does not schedule anything new', () => {
  const desired = desiredReminders(bothOn, 0);
  const scheduled = desired.map((reminder) => ({
    identifier: reminder.identifier,
    hour: reminder.hour,
    minute: reminder.minute,
  }));
  assert.deepEqual(planReminderReconcile(bothOn, scheduled, 3), []);
});

test('an enabled legacy reminder keeps its time and adopts the three nudges', () => {
  const { preferences, didMigrate } = migrateReminderPreferences({
    remindersEnabled: null,
    customReminderEnabled: null,
    customReminderTime: null,
    legacyReminderTime: '07:15',
  }, true);

  assert.equal(didMigrate, true);
  assert.deepEqual(preferences, {
    remindersEnabled: true,
    customReminderEnabled: true,
    customReminderTime: '07:15',
  });

  const actions = planReminderReconcile(preferences, [
    { identifier: LEGACY_REMINDER_ID, hour: 7, minute: 15 },
  ]);
  assert.deepEqual(
    actions.filter((action) => action.type === 'cancel').map((action) => action.identifier),
    [LEGACY_REMINDER_ID],
  );
  assert.equal(actions.filter((action) => action.type === 'schedule').length, 4);
  const custom = actions.find(
    (action) => action.type === 'schedule' && action.reminder.identifier === CUSTOM_REMINDER_ID,
  );
  assert.equal(custom?.type === 'schedule' && custom.reminder.hour, 7);
  assert.equal(custom?.type === 'schedule' && custom.reminder.minute, 15);
});

test('a saved default time does not turn reminders on', () => {
  const { preferences } = migrateReminderPreferences({
    remindersEnabled: null,
    customReminderEnabled: null,
    customReminderTime: null,
    legacyReminderTime: '08:00',
  }, false);

  assert.deepEqual(preferences, {
    remindersEnabled: false,
    customReminderEnabled: false,
    customReminderTime: '08:00',
  });
  assert.deepEqual(desiredReminders(preferences), []);
});

test('already saved preferences survive a later upgrade check', () => {
  const { preferences, didMigrate } = migrateReminderPreferences({
    remindersEnabled: false,
    customReminderEnabled: true,
    customReminderTime: '06:45',
    legacyReminderTime: '08:00',
  }, true);

  assert.equal(didMigrate, false);
  assert.equal(preferences.remindersEnabled, false);
  assert.equal(preferences.customReminderEnabled, true);
  assert.equal(preferences.customReminderTime, '06:45');
  assert.deepEqual(planReminderReconcile(preferences, [
    { identifier: LEGACY_REMINDER_ID, hour: 8, minute: 0 },
  ]), [{ type: 'cancel', identifier: LEGACY_REMINDER_ID }]);
});
