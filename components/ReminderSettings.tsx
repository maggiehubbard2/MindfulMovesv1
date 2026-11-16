import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import {
  BUILTIN_NUDGES,
  formatClock,
  formatDisplayTime,
  timeStringToDate,
  dateToTimeString,
} from '@/utils/reminderSchedule';
import {
  EMPTY_PREFS,
  ensureReminderPreferences,
  reminderSummary,
  setCustomReminderEnabled,
  setCustomReminderTime,
  setDailyRemindersEnabled,
  type ReminderUpdateResult,
} from '@/utils/reminderNotifications';
import type { ReminderPreferences } from '@/utils/reminderSchedule';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Alert, Modal, Platform, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ReminderSettings() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<ReminderPreferences>(EMPTY_PREFS);
  const [ready, setReady] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [draftTime, setDraftTime] = useState(() => timeStringToDate(null));

  const refresh = useCallback(async () => {
    if (!user) {
      setReady(true);
      return;
    }
    try {
      const next = await ensureReminderPreferences(user.id);
      setPrefs(next);
    } catch (error) {
      if (__DEV__) console.warn('[reminders] settings refresh failed', error);
    } finally {
      setReady(true);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const applyResult = (result: ReminderUpdateResult, enabled: boolean) => {
    setPrefs(result.preferences);
    if (!result.ok) {
      Alert.alert(
        'Permission needed',
        'Notifications need to be allowed before Daily Reminders can be turned on.',
      );
      return;
    }
    if (enabled) {
      const custom = result.preferences.customReminderEnabled && result.preferences.customReminderTime
        ? ` Your extra reminder stays at ${formatDisplayTime(result.preferences.customReminderTime)}.`
        : '';
      Alert.alert(
        'Daily reminders on',
        `You'll get nudges at 9:00 AM, 2:00 PM, and 8:00 PM.${custom}`,
      );
      return;
    }
    Alert.alert(
      'Daily reminders off',
      'All habit reminders are off. Your custom time is saved for when you turn them back on.',
    );
  };

  const toggleDaily = async (enabled: boolean) => {
    if (!user) return;
    const result = await setDailyRemindersEnabled(user.id, enabled);
    applyResult(result, enabled);
  };

  const toggleCustom = async (enabled: boolean) => {
    if (!user) return;
    const next = await setCustomReminderEnabled(user.id, enabled);
    setPrefs(next);
    if (enabled) {
      Alert.alert(
        'Custom reminder on',
        `You'll also get a reminder at ${formatDisplayTime(next.customReminderTime)}.`,
      );
    } else {
      Alert.alert('Custom reminder off', 'Your three daily nudges are still on.');
    }
  };

  const saveDraftTime = async (date: Date) => {
    if (!user) return;
    const next = await setCustomReminderTime(user.id, dateToTimeString(date));
    setPrefs(next);
    Alert.alert(
      'Custom reminder updated',
      `Your extra reminder is now ${formatDisplayTime(next.customReminderTime)}.`,
    );
  };

  const openPicker = () => {
    setDraftTime(timeStringToDate(prefs.customReminderTime));
    setShowTimePicker(true);
  };

  const closePicker = () => {
    setShowTimePicker(false);
    if (Platform.OS !== 'ios') return;
    const next = dateToTimeString(draftTime);
    if (next === prefs.customReminderTime) return;
    saveDraftTime(draftTime);
  };

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Notifications</Text>

      <View style={[styles.settingItem, { backgroundColor: colors.card }]}>
        <View style={styles.settingInfo}>
          <Text style={[styles.settingTitle, { color: colors.text }]}>Daily Reminders</Text>
          <Text style={[styles.settingDescription, { color: colors.secondary }]}>
            {ready ? reminderSummary(prefs) : 'Turns every habit reminder on or off.'}
          </Text>
        </View>
        <Switch
          value={prefs.remindersEnabled}
          onValueChange={toggleDaily}
          disabled={!ready || !user}
          trackColor={{ false: '#767577', true: colors.primary }}
          thumbColor="#f4f3f4"
        />
      </View>

      {prefs.remindersEnabled && (
        <>
          <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.settingTitle, { color: colors.text }]}>Daily Nudges</Text>
            {BUILTIN_NUDGES.map((nudge) => (
              <Text key={nudge.id} style={[styles.nudgeLine, { color: colors.secondary }]}>
                {nudge.label} — {formatClock(nudge.hour, nudge.minute)}
              </Text>
            ))}
            <Text style={[styles.nudgeNote, { color: colors.secondary }]}>
              These reminders are set for you.
            </Text>
          </View>

          <View style={[styles.settingItem, { backgroundColor: colors.card }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>
                Add a Custom Reminder (Optional)
              </Text>
              <Text style={[styles.settingDescription, { color: colors.secondary }]}>
                Want an extra nudge? Choose a time that works for you.
              </Text>
            </View>
            <Switch
              value={prefs.customReminderEnabled}
              onValueChange={toggleCustom}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor="#f4f3f4"
            />
          </View>

          {prefs.customReminderEnabled && (
            <TouchableOpacity
              style={[styles.settingItem, { backgroundColor: colors.card }]}
              onPress={openPicker}
              activeOpacity={0.7}
            >
              <View style={styles.settingInfo}>
                <View style={styles.timePickerRow}>
                  <Ionicons name="time-outline" size={20} color={colors.text} />
                  <Text style={[styles.settingText, { color: colors.text }]}>Reminder Time</Text>
                </View>
                <Text style={[styles.timeDisplay, { color: colors.primary }]}>
                  {formatDisplayTime(prefs.customReminderTime)}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.secondary} />
            </TouchableOpacity>
          )}
        </>
      )}

      {showTimePicker && (
        Platform.OS === 'ios' ? (
          <Modal visible transparent animationType="slide" onRequestClose={closePicker}>
            <View style={styles.modalOverlay}>
              <View style={[styles.timePickerModal, { backgroundColor: colors.card }]}>
                <View style={styles.timePickerHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Select Time</Text>
                  <TouchableOpacity onPress={closePicker} style={styles.closeButton}>
                    <Text style={[styles.closeButtonText, { color: colors.primary }]}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={draftTime}
                  mode="time"
                  is24Hour={false}
                  display="spinner"
                  onChange={(_event, selected) => {
                    if (selected) setDraftTime(selected);
                  }}
                  textColor={colors.text}
                />
              </View>
            </View>
          </Modal>
        ) : (
          <DateTimePicker
            value={draftTime}
            mode="time"
            is24Hour={false}
            display="default"
            onChange={(event, selected) => {
              setShowTimePicker(false);
              if (event.type === 'dismissed' || !selected) return;
              saveDraftTime(selected);
            }}
          />
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  infoCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
  },
  nudgeLine: {
    fontSize: 14,
    marginTop: 6,
  },
  nudgeNote: {
    fontSize: 13,
    marginTop: 10,
  },
  settingText: {
    fontSize: 16,
    marginLeft: 8,
  },
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  timeDisplay: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  timePickerModal: {
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  timePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
