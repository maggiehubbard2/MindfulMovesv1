import { supabase } from '@/config/supabase';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const presetPalette = [
  '#FF3B30',
  '#FF9500',
  '#FFCC00',
  '#34C759',
  '#30B0C7',
  '#007AFF',
  '#5856D6',
  '#AF52DE',
  '#BF5AF2',
  '#FF2D55',
  '#FF9F0A',
  '#FFD60A',
  '#64D2FF',
  '#5E5CE6',
  '#D55F5C',
  '#9AC85D',
];

const normalizeHex = (hex: string) => {
  let value = hex.trim();
  if (!value.startsWith('#')) {
    value = `#${value}`;
  }
  if (value.length === 4) {
    value =
      '#' +
      value
        .slice(1)
        .split('')
        .map((char) => char + char)
        .join('');
  }
  return value.slice(0, 7).toUpperCase();
};

export default function SettingsScreen() {
  const { isDarkMode, toggleDarkMode, colors, accentColor, setAccentColor, customAccentColor } = useTheme();
  const { user, userProfile, logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [tempCustomColor, setTempCustomColor] = useState(customAccentColor);
  const [hexInput, setHexInput] = useState(customAccentColor);
  const [isReminderEnabled, setIsReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState<Date>(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isLoadingReminderTime, setIsLoadingReminderTime] = useState(true);
  const [pendingTimeUpdate, setPendingTimeUpdate] = useState<Date | null>(null);

  // Load reminder time from database (with local cache fallback)
  useEffect(() => {
    loadReminderTime();
  }, [user]);

  // Check if reminder is already set on mount
  useEffect(() => {
    checkExistingNotifications();
  }, []);

  const loadReminderTime = async () => {
    if (!user) {
      setIsLoadingReminderTime(false);
      return;
    }

    try {
      // Try to load from local cache first for faster load
      const cachedTime = await AsyncStorage.getItem('reminderTime');
      if (cachedTime) {
        const [hours, minutes] = cachedTime.split(':').map(Number);
        const time = new Date();
        time.setHours(hours, minutes, 0, 0);
        setReminderTime(time);
        setIsLoadingReminderTime(false);
      }

      // Then fetch from database
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
          // Use default time for now
          const defaultTime = new Date();
          defaultTime.setHours(8, 0, 0, 0);
          setReminderTime(defaultTime);
          setIsLoadingReminderTime(false);
          return;
        }
        throw error;
      }

      if (data?.reminder_time) {
        const [hours, minutes] = data.reminder_time.split(':').map(Number);
        const time = new Date();
        time.setHours(hours, minutes, 0, 0);
        setReminderTime(time);
        // Cache it locally
        await AsyncStorage.setItem('reminderTime', data.reminder_time);
      } else {
        // Default to 8:00 AM if no time is set
        const defaultTime = new Date();
        defaultTime.setHours(8, 0, 0, 0);
        setReminderTime(defaultTime);
      }
    } catch (error: any) {
      // Only log non-column-missing errors
      if (error?.code !== '42703' && error?.code !== 'PGRST204') {
        console.error('Error loading reminder time:', error);
      }
      // Fall back to default time
      const defaultTime = new Date();
      defaultTime.setHours(8, 0, 0, 0);
      setReminderTime(defaultTime);
    } finally {
      setIsLoadingReminderTime(false);
    }
  };

  const saveReminderTime = async (time: Date) => {
    if (!user) return;

    const hours = time.getHours();
    const minutes = time.getMinutes();
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    try {
      // Save to database
      const { error } = await supabase
        .from('users')
        .update({ reminder_time: timeString })
        .eq('id', user.id);

      // Handle case where column doesn't exist yet
      if (error) {
        if (error.code === '42703' || error.code === 'PGRST204') {
          Alert.alert(
            'Database Migration Required',
            'Please run the SQL migration to add the reminder_time column. Check supabase_reminder_time.sql file.',
            [{ text: 'OK' }]
          );
          return;
        }
        throw error;
      }

      // Cache locally
      await AsyncStorage.setItem('reminderTime', timeString);
    } catch (error: any) {
      if (error?.code !== '42703' && error?.code !== 'PGRST204') {
        console.error('Error saving reminder time:', error);
        Alert.alert(
          'Error',
          'Failed to save reminder time. Please try again.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const formatTime = (date: Date): string => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

  const checkExistingNotifications = async () => {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const hasReminder = scheduledNotifications.some(
        notification => notification.identifier === 'daily-habit-reminder'
      );
      setIsReminderEnabled(hasReminder);
    } catch (error) {
      console.error('Error checking notifications:', error);
    }
  };

  // Reschedule reminder with new time (without showing disabled alert)
  const rescheduleReminder = async (newTime: Date) => {
    try {
      // Cancel existing reminder
      await Notifications.cancelScheduledNotificationAsync('daily-habit-reminder');

      // Use the new reminder time
      const hours = newTime.getHours();
      const minutes = newTime.getMinutes();

      // Schedule daily reminder at the new time
      const trigger: Notifications.DailyTriggerInput = {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: hours,
        minute: minutes,
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

      // Update state
      setIsReminderEnabled(true);
      
      // Show success message with updated time
      const timeString = formatTime(newTime);
      Alert.alert(
        'Reminder Time Updated',
        `Your daily reminder has been updated to ${timeString}.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error rescheduling reminder:', error);
      Alert.alert(
        'Error',
        'Failed to update reminder time. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleToggleReminder = async (value: boolean) => {
    try {
      if (value) {
        // Enable reminder
        const { status } = await Notifications.requestPermissionsAsync();
        
        if (status !== 'granted') {
          Alert.alert(
            'Permission Denied',
            'Notifications permission is required to set reminders. Please enable it in your device settings.',
            [{ text: 'OK' }]
          );
          return;
        }

        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
          });
        }

        // Cancel existing reminder if any
        await Notifications.cancelScheduledNotificationAsync('daily-habit-reminder');

        // Use the saved reminder time
        const hours = reminderTime.getHours();
        const minutes = reminderTime.getMinutes();

        // Schedule daily reminder at the selected time
        const trigger: Notifications.DailyTriggerInput = {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: hours,
          minute: minutes,
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

        setIsReminderEnabled(true);
        const timeString = formatTime(reminderTime);
        Alert.alert(
          'Reminder Enabled',
          `Your daily reminder has been set for ${timeString}.`,
          [{ text: 'OK' }]
        );
      } else {
        // Disable reminder (only show alert when user actually toggles off)
        await Notifications.cancelScheduledNotificationAsync('daily-habit-reminder');
        setIsReminderEnabled(false);
        Alert.alert(
          'Reminder Disabled',
          'Your daily reminder has been cancelled.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error toggling reminder:', error);
      Alert.alert(
        'Error',
        'Failed to update reminder. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (selectedTime) {
      setReminderTime(selectedTime);
      saveReminderTime(selectedTime);
      
      // Store the pending update - we'll reschedule after picker closes
      if (isReminderEnabled) {
        setPendingTimeUpdate(selectedTime);
      }
    }

    // For Android, picker closes automatically, so we delay the reschedule
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
      // Delay to ensure picker is closed before showing alert
      setTimeout(() => {
        if (selectedTime && isReminderEnabled) {
          rescheduleReminder(selectedTime);
          setPendingTimeUpdate(null);
        }
      }, 300);
    }
  };

  const handleCloseTimePicker = () => {
    setShowTimePicker(false);
    // For iOS, reschedule after modal closes
    if (pendingTimeUpdate && isReminderEnabled) {
      setTimeout(() => {
        rescheduleReminder(pendingTimeUpdate);
        setPendingTimeUpdate(null);
      }, 300);
    }
  };

  const confirmLogout = async () => {
    try {
      setShowLogoutModal(false); // Close modal first for better UX
      await logout();
      // Don't navigate manually - let index.tsx handle it based on user state
      // This avoids race conditions and ensures auth state has propagated
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to logout');
      // Reopen modal if logout failed
      setShowLogoutModal(true);
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const accentColorOptions = [
    { name: 'Blue', value: 'blue', color: '#007AFF' },
    { name: 'Pink', value: 'pink', color: '#ff60ce' },
    { name: 'Green', value: 'green', color: '#34C759' },
    { name: 'Purple', value: 'purple', color: '#AF52DE' },
    {
      name: 'Custom',
      value: 'custom',
      color: customAccentColor,
      isCustom: true,
    },
  ];

  const handleOpenColorPicker = () => {
    setTempCustomColor(customAccentColor);
    setHexInput(customAccentColor);
    setShowColorPicker(true);
  };

  const handleSelectPreset = (color: string) => {
    const normalized = normalizeHex(color);
    setTempCustomColor(normalized);
    setHexInput(normalized);
  };

  const isValidHex = useMemo(() => /^#([0-9A-F]{6})$/i.test(hexInput.trim()), [hexInput]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
      </View>
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Display Settings</Text>
          
          <View style={[styles.settingItem, { backgroundColor: colors.card }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Dark Mode</Text>
              <Text style={[styles.settingDescription, { color: colors.secondary }]}>
                Switch between light and dark theme
              </Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor={isDarkMode ? '#f4f3f4' : '#f4f3f4'}
            />
          </View>

          <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
            <View style={styles.settingInfo}>
              <Ionicons name="color-palette-outline" size={24} color={colors.text} />
              <Text style={[styles.settingText, { color: colors.text }]}>Accent Color</Text>
            </View>
            <View style={styles.colorOptions}>
              {accentColorOptions.map((option) => {
                const isActive = accentColor === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.colorOption,
                      { borderColor: isActive ? colors.primary : colors.border },
                    ]}
                    onPress={() => {
                      if (option.value === 'custom') {
                        handleOpenColorPicker();
                      } else {
                        setAccentColor(option.value as any);
                      }
                    }}
                  >
                    {option.isCustom ? (
                      <View style={styles.customSwatchOuter}>
                        <LinearGradient
                          colors={[
                            '#FF3B30',
                            '#FF9500',
                            '#FFCC00',
                            '#34C759',
                            '#30B0C7',
                            '#007AFF',
                            '#AF52DE',
                            '#FF2D55',
                            '#FF3B30',
                          ]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.colorWheelRing}
                        />
                        <View
                          style={[
                            styles.customSwatchInner,
                            { backgroundColor: option.color },
                          ]}
                        />
                        {isActive && (
                          <View style={styles.customCheckBadge}>
                            <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                          </View>
                        )}
                      </View>
                    ) : (
                      <View
                      style={[
                        styles.presetSwatchInner,
                        { backgroundColor: option.color },
                      ]}
                    >
                      {isActive && (
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      )}
                    </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Notifications</Text>
          
          <View style={[styles.settingItem, { backgroundColor: colors.card }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Daily Reminders</Text>
              <Text style={[styles.settingDescription, { color: colors.secondary }]}>
                {isReminderEnabled 
                  ? `Receive a daily reminder at ${formatTime(reminderTime)} to complete your habits`
                  : 'Get daily reminders to complete your habits'}
              </Text>
            </View>
            <Switch
              value={isReminderEnabled}
              onValueChange={handleToggleReminder}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor={isReminderEnabled ? '#f4f3f4' : '#f4f3f4'}
            />
          </View>

          {/* Reminder Time Picker */}
          {isReminderEnabled && (
            <TouchableOpacity
              style={[styles.settingItem, { backgroundColor: colors.card }]}
              onPress={() => setShowTimePicker(true)}
              activeOpacity={0.7}
            >
              <View style={styles.settingInfo}>
                <View style={styles.timePickerRow}>
                  <Ionicons name="time-outline" size={20} color={colors.text} />
                  <Text style={[styles.settingText, { color: colors.text, marginLeft: 8 }]}>
                    Reminder Time
                  </Text>
                </View>
                {!isLoadingReminderTime && (
                  <Text style={[styles.timeDisplay, { color: colors.primary }]}>
                    {formatTime(reminderTime)}
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.secondary} />
            </TouchableOpacity>
          )}

          {/* Time Picker Modal (iOS) or Inline (Android) */}
          {showTimePicker && (
            Platform.OS === 'ios' ? (
              <Modal
                visible={showTimePicker}
                transparent={true}
                animationType="slide"
                onRequestClose={handleCloseTimePicker}
              >
                <View style={styles.modalOverlay}>
                  <View style={[styles.timePickerModal, { backgroundColor: colors.card }]}>
                    <View style={styles.timePickerHeader}>
                      <Text style={[styles.modalTitle, { color: colors.text }]}>Select Time</Text>
                      <TouchableOpacity
                        onPress={handleCloseTimePicker}
                        style={styles.closeButton}
                      >
                        <Text style={[styles.closeButtonText, { color: colors.primary }]}>Done</Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={reminderTime}
                      mode="time"
                      is24Hour={false}
                      display="spinner"
                      onChange={handleTimeChange}
                      textColor={colors.text}
                    />
                  </View>
                </View>
              </Modal>
            ) : (
              <DateTimePicker
                value={reminderTime}
                mode="time"
                is24Hour={false}
                display="default"
                onChange={handleTimeChange}
              />
            )
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>
          <TouchableOpacity 
            style={[styles.settingItem, { backgroundColor: colors.card }]}
            onPress={() => router.push('/editprofile')}
          >
            <View style={styles.settingInfo}>
              <Ionicons name="person-outline" size={24} color={colors.text} />
              <View style={styles.userInfo}>
                <Text style={[styles.settingText, { color: colors.text }]}>
                  {userProfile?.firstName || user?.email || 'User'}
                </Text>
                <Text style={[styles.userEmail, { color: colors.secondary }]}>{user?.email}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.secondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: '#FF3B30' }]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="white" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
          <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
            <View style={styles.settingInfo}>
              <Ionicons name="information-circle-outline" size={24} color={colors.text} />
              <Text style={[styles.settingText, { color: colors.text }]}>Version</Text>
            </View>
            <Text style={[styles.settingValue, { color: colors.text }]}>1.0.0</Text>
          </View>
        </View>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showColorPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowColorPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.colorPickerContent, { backgroundColor: colors.card }]}>
            <Ionicons name="color-palette-outline" size={40} color={colors.primary} style={styles.modalIcon} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>Choose Accent Color</Text>
            <Text style={[styles.modalMessage, { color: colors.secondary }]}>
              Tap a color below or enter a custom HEX value.
            </Text>

            <View style={styles.presetGrid}>
              {presetPalette.map((paletteColor) => {
                const normalized = normalizeHex(paletteColor);
                const isSelected = tempCustomColor === normalized;
                return (
                  <TouchableOpacity
                    key={normalized}
                    style={[
                      styles.presetSwatch,
                      { backgroundColor: normalized },
                      isSelected && styles.selectedPreset,
                    ]}
                    onPress={() => handleSelectPreset(normalized)}
                  >
                    {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={[styles.hexInputContainer, { borderColor: colors.border }]}>
              <Text style={[styles.hexLabel, { color: colors.secondary }]}>HEX</Text>
              <TextInput
                value={hexInput}
                onChangeText={(text) => {
                  const formatted = text.startsWith('#') ? text.toUpperCase() : `#${text.toUpperCase()}`;
                  setHexInput(formatted);
                  if (/^#([0-9A-F]{3})$/i.test(formatted) || /^#([0-9A-F]{6})$/i.test(formatted)) {
                    setTempCustomColor(normalizeHex(formatted));
                  }
                }}
                style={[styles.hexInput, { color: colors.text }]}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={7}
                placeholder="#FF6B6B"
                placeholderTextColor={colors.secondary}
              />
              <View style={[styles.hexPreview, { backgroundColor: tempCustomColor }]} />
            </View>
            {!isValidHex && (
              <Text style={styles.validationText}>Enter a valid 6-digit HEX code (e.g., #FF6B6B).</Text>
            )}

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.border }]}
                onPress={() => setShowColorPicker(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  {
                    backgroundColor: tempCustomColor,
                    opacity: isValidHex ? 1 : 0.5,
                  },
                ]}
                onPress={() => {
                  if (isValidHex) {
                    setAccentColor('custom', tempCustomColor);
                    setShowColorPicker(false);
                  }
                }}
                disabled={!isValidHex}
              >
                <Text style={styles.modalButtonText}>Use Color</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Ionicons name="log-out-outline" size={48} color="#FF3B30" style={styles.modalIcon} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>Logout</Text>
            <Text style={[styles.modalMessage, { color: colors.secondary }]}>
              Are you sure you want to logout?
            </Text>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.border }]}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#FF3B30' }]}
                onPress={confirmLogout}
              >
                <Text style={styles.modalButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
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
  settingText: {
    fontSize: 16,
    marginLeft: 12,
  },
  settingValue: {
    fontSize: 16,
    opacity: 0.7,
  },
  userInfo: {
    marginLeft: 12,
  },
  userEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  colorOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  presetSwatchInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customSwatchOuter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customSwatchInner: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  colorWheelRing: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#FF2D55',
    opacity: 0.8,
  },
  customCheckBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    backgroundColor: '#00000080',
    borderRadius: 12,
    padding: 4,
  },
  colorPickerContent: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  presetSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedPreset: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  hexInputContainer: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hexLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  hexInput: {
    flex: 1,
    fontSize: 16,
  },
  hexPreview: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  validationText: {
    fontSize: 12,
    color: '#FF3B30',
    alignSelf: 'flex-start',
    paddingHorizontal: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
  timePickerModal: {
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  timePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
