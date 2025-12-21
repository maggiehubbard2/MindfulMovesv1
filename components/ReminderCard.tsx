import { supabase } from '@/config/supabase';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface ReminderCardProps {
  onSetReminder?: () => void;
}

export default function ReminderCard({ onSetReminder }: ReminderCardProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [isReminderSet, setIsReminderSet] = useState(false);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [reminderTime, setReminderTime] = useState<{ hour: number; minute: number }>({ hour: 8, minute: 0 });

  useEffect(() => {
    // Register for push notifications
    registerForPushNotificationsAsync().then(token => setExpoPushToken(token));
    
    // Load reminder time from database
    loadReminderTime();
  }, [user]);

  // Re-check notification status when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      checkExistingNotifications();
    }, [])
  );

  const loadReminderTime = async () => {
    if (!user) return;

    try {
      // Try cache first
      const cachedTime = await AsyncStorage.getItem('reminderTime');
      if (cachedTime) {
        const [hours, minutes] = cachedTime.split(':').map(Number);
        setReminderTime({ hour: hours, minute: minutes });
      }

      // Fetch from database
      const { data, error } = await supabase
        .from('users')
        .select('reminder_time')
        .eq('id', user.id)
        .single();

      // Handle case where column doesn't exist yet (error codes 42703 or PGRST204)
      if (error) {
        // If column doesn't exist, use default time and don't log as error
        if (error.code === '42703' || error.code === 'PGRST204') {
          // Column doesn't exist - user needs to run migration
          // Keep default 8:00 AM
          return;
        }
        throw error;
      }

      if (data?.reminder_time) {
        const [hours, minutes] = data.reminder_time.split(':').map(Number);
        setReminderTime({ hour: hours, minute: minutes });
        await AsyncStorage.setItem('reminderTime', data.reminder_time);
      }
    } catch (error: any) {
      // Only log non-column-missing errors
      if (error?.code !== '42703' && error?.code !== 'PGRST204') {
        console.error('Error loading reminder time:', error);
      }
      // Keep default 8:00 AM
    }
  };

  const formatTime = (hour: number, minute: number): string => {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHours = hour % 12 || 12;
    const displayMinutes = minute.toString().padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

  const checkExistingNotifications = async () => {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    const hasReminder = scheduledNotifications.some(
      notification => notification.identifier === 'daily-habit-reminder'
    );
    setIsReminderSet(hasReminder);
  };

  const registerForPushNotificationsAsync = async () => {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please enable notifications in your device settings to receive reminders.',
        [{ text: 'OK' }]
      );
      return null;
    }
    
    token = (await Notifications.getExpoPushTokenAsync()).data;
    return token;
  };

  const handleSetReminder = async () => {
    try {
      // Request permissions first
      const { status } = await Notifications.requestPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Notifications permission is required to set reminders. Please enable it in your device settings.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Cancel existing reminder if any
      await Notifications.cancelScheduledNotificationAsync('daily-habit-reminder');

      // Schedule daily reminder at the saved time (or default 8:00 AM)
      const trigger: Notifications.DailyTriggerInput = {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: reminderTime.hour,
        minute: reminderTime.minute,
      };

      await Notifications.scheduleNotificationAsync({
        identifier: 'daily-habit-reminder',
        content: {
          title: 'Time for your habits! 🌟',
          body: 'Don\'t forget to complete your daily habits!',
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger,
      });

      setIsReminderSet(true);
      const timeString = formatTime(reminderTime.hour, reminderTime.minute);
      Alert.alert(
        'Reminder Set!',
        `You'll receive a daily reminder at ${timeString} to complete your habits. You can change this time in Settings.`,
        [{ text: 'OK' }]
      );
      onSetReminder?.();
    } catch (error) {
      console.error('Error setting reminder:', error);
      Alert.alert(
        'Error',
        'Failed to set reminder. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleCancelReminder = async () => {
    try {
      await Notifications.cancelScheduledNotificationAsync('daily-habit-reminder');
      setIsReminderSet(false);
      Alert.alert(
        'Reminder Cancelled',
        'Your daily reminder has been cancelled.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error cancelling reminder:', error);
    }
  };

  // Hide the card if reminder is already active
  if (isReminderSet) {
    return null;
  }

  return (
    <View style={[
      styles.container,
      { 
        backgroundColor: colors.primary + '15', // 15% opacity version of primary
      }
    ]}>
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.text }]}>
            {isReminderSet ? 'Reminder Active' : 'Set the reminder'}
          </Text>
          <Text style={[styles.description, { color: colors.secondary }]}>
            {isReminderSet 
              ? `You'll receive a daily reminder at ${formatTime(reminderTime.hour, reminderTime.minute)} to complete your habits.`
              : 'Never miss your morning routine! Set a reminder to stay on track'}
          </Text>
        </View>
        
        <View style={styles.iconContainer}>
          <Ionicons name="notifications" size={48} color={colors.primary} />
          {/* Sound waves effect */}
          <View style={styles.soundWaves}>
            <View style={[styles.wave, { borderColor: colors.primary }]} />
            <View style={[styles.wave, styles.wave2, { borderColor: colors.primary }]} />
            <View style={[styles.wave, styles.wave3, { borderColor: colors.primary }]} />
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.button, 
          { 
            backgroundColor: isReminderSet ? colors.border : colors.primary 
          }
        ]}
        onPress={isReminderSet ? handleCancelReminder : handleSetReminder}
        activeOpacity={0.8}
      >
        <Ionicons 
          name={isReminderSet ? "checkmark-circle" : "notifications-outline"} 
          size={20} 
          color="white" 
          style={styles.buttonIcon}
        />
        <Text style={styles.buttonText}>
          {isReminderSet ? 'Reminder Set' : 'Set Now'}
        </Text>
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
    shadowOffset: {
      width: 0,
      height: 4,
    },
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
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

