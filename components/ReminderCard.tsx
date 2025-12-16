import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import React, { useState, useEffect } from 'react';
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface ReminderCardProps {
  onSetReminder?: () => void;
}

export default function ReminderCard({ onSetReminder }: ReminderCardProps) {
  const { colors } = useTheme();
  const [isReminderSet, setIsReminderSet] = useState(false);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

  useEffect(() => {
    // Check if notification is already scheduled
    checkExistingNotifications();
    
    // Register for push notifications
    registerForPushNotificationsAsync().then(token => setExpoPushToken(token));
  }, []);

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

      // Schedule daily reminder at 8:00 AM
      const trigger = {
        hour: 8,
        minute: 0,
        repeats: true,
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
      Alert.alert(
        'Reminder Set!',
        'You\'ll receive a daily reminder at 8:00 AM to complete your habits.',
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
              ? 'You\'ll receive a daily reminder at 8:00 AM to complete your habits.'
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

