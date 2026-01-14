import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Habit } from '@/context/HabitsContext';

/**
 * Widget Data Utility
 * 
 * Shares habit data between the React Native app and native widgets
 * using platform-specific shared storage mechanisms.
 * 
 * iOS: Uses App Group UserDefaults via native module
 * Android: Uses SharedPreferences (AsyncStorage uses SharedPreferences)
 * 
 * Data Format:
 * - Stores today's habits in a simplified JSON format
 * - Includes only essential fields for widget display
 * - Updates whenever habits change in the app
 */

export interface WidgetHabit {
  id: string;
  name: string;
  completed: boolean;
}

export interface WidgetData {
  habits: WidgetHabit[];
  lastUpdated: string; // ISO timestamp
  totalHabits: number;
  completedCount: number;
}

/**
 * Writes habit data to shared storage for widget access
 * Called whenever habits are updated in the app
 */
export async function writeWidgetData(habits: Habit[]): Promise<void> {
  try {
    // Get today's date string for filtering
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // Filter to only today's habits and convert to widget format
    const todayHabits = habits.filter(habit => {
      // Include habits that exist today (created on or before today)
      const createdAt = new Date(habit.createdAt);
      createdAt.setHours(0, 0, 0, 0);
      return createdAt <= today;
    });

    // Convert to widget-friendly format
    const widgetHabits: WidgetHabit[] = todayHabits.map(habit => ({
      id: habit.id,
      name: habit.name,
      completed: habit.completed || (habit.completionDates || []).includes(todayStr),
    }));

    // Create widget data object
    const widgetData: WidgetData = {
      habits: widgetHabits,
      lastUpdated: new Date().toISOString(),
      totalHabits: widgetHabits.length,
      completedCount: widgetHabits.filter(h => h.completed).length,
    };

    const widgetDataJson = JSON.stringify(widgetData);

    // Platform-specific storage
    if (Platform.OS === 'ios') {
      // iOS: Write to App Group UserDefaults via native module
      try {
        const { WidgetDataModule } = NativeModules;
        if (WidgetDataModule) {
          await WidgetDataModule.writeWidgetData(widgetDataJson);
        } else {
          // Fallback to AsyncStorage if native module not available
          await AsyncStorage.setItem('widget_habits', widgetDataJson);
        }
      } catch (error) {
        // Fallback to AsyncStorage
        await AsyncStorage.setItem('widget_habits', widgetDataJson);
      }
    } else {
      // Android: Write to SharedPreferences (via AsyncStorage)
      // The widget reads from the same SharedPreferences
      await AsyncStorage.setItem('widget_habits', widgetDataJson);
    }
  } catch (error) {
    // Fail silently - widget data is non-critical
    if (__DEV__) {
      console.error('Error writing widget data:', error);
    }
  }
}

/**
 * Reads widget data from shared storage
 * Used by native widget code to display habits
 */
export async function readWidgetData(): Promise<WidgetData | null> {
  try {
    const data = await AsyncStorage.getItem('widget_habits');
    if (!data) return null;
    return JSON.parse(data) as WidgetData;
  } catch (error) {
    if (__DEV__) {
      console.error('Error reading widget data:', error);
    }
    return null;
  }
}

