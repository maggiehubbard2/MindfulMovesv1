import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { ensureReminderPreferences, setDailyRemindersEnabled } from '@/utils/reminderNotifications';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ReminderCardProps {
  onSetReminder?: () => void;
}

export default function ReminderCard({ onSetReminder }: ReminderCardProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!user) {
        setVisible(false);
        return;
      }
      let cancelled = false;
      ensureReminderPreferences(user.id)
        .then((prefs) => {
          if (!cancelled) setVisible(!prefs.remindersEnabled);
        })
        .catch(() => {
          if (!cancelled) setVisible(false);
        });
      return () => {
        cancelled = true;
      };
    }, [user]),
  );

  const handleSetReminder = async () => {
    if (!user) return;
    const result = await setDailyRemindersEnabled(user.id, true);
    if (!result.ok) {
      Alert.alert(
        'Permission needed',
        'Notifications need to be allowed before Daily Reminders can be turned on.',
      );
      return;
    }
    setVisible(false);
    Alert.alert(
      'Daily reminders on',
      'You\'ll get a nudge at 9:00 AM, 2:00 PM, and 8:00 PM. You can add an extra reminder in Settings.',
    );
    onSetReminder?.();
  };

  if (!visible) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.primary + '15' }]}>
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.text }]}>Daily reminders</Text>
          <Text style={[styles.description, { color: colors.secondary }]}>
            Get reminders to check in with your habits.
          </Text>
        </View>

        <View style={styles.iconContainer}>
          <Ionicons name="notifications" size={48} color={colors.primary} />
          <View style={styles.soundWaves}>
            <View style={[styles.wave, { borderColor: colors.primary }]} />
            <View style={[styles.wave, styles.wave2, { borderColor: colors.primary }]} />
            <View style={[styles.wave, styles.wave3, { borderColor: colors.primary }]} />
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={handleSetReminder}
        activeOpacity={0.8}
      >
        <Ionicons name="notifications-outline" size={20} color="white" style={styles.buttonIcon} />
        <Text style={styles.buttonText}>Turn on</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  textContainer: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: 80,
    height: 80,
  },
  soundWaves: {
    position: 'absolute',
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wave: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    opacity: 0.3,
  },
  wave2: {
    width: 70,
    height: 70,
    borderRadius: 35,
    opacity: 0.2,
  },
  wave3: {
    width: 80,
    height: 80,
    borderRadius: 40,
    opacity: 0.1,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonIcon: {
    marginRight: 0,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
