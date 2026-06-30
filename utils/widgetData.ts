import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Habit } from '@/context/HabitsContext';
import { calculateCurrentStreak } from '@/utils/streak';

/**
 * Shares today's habit snapshot with the iOS home screen widget via App Group.
 * Android widget support is planned separately.
 */

export interface WidgetHabit {
  id: string;
  name: string;
  completed: boolean;
}

export interface WidgetData {
  habits: WidgetHabit[];
  lastUpdated: string;
  totalHabits: number;
  completedCount: number;
  currentStreak: number;
}

export async function writeWidgetData(habits: Habit[]): Promise<void> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const todayHabits = habits.filter((habit) => {
      const createdAt = new Date(habit.createdAt);
      createdAt.setHours(0, 0, 0, 0);
      return createdAt <= today;
    });

    const widgetHabits: WidgetHabit[] = todayHabits.map((habit) => ({
      id: habit.id,
      name: habit.name,
      completed: habit.completed || (habit.completionDates || []).includes(todayStr),
    }));

    const widgetData: WidgetData = {
      habits: widgetHabits,
      lastUpdated: new Date().toISOString(),
      totalHabits: widgetHabits.length,
      completedCount: widgetHabits.filter((h) => h.completed).length,
      currentStreak: calculateCurrentStreak(habits),
    };

    const widgetDataJson = JSON.stringify(widgetData);

    if (Platform.OS === 'ios') {
      const { WidgetDataModule } = NativeModules;
      if (WidgetDataModule) {
        await WidgetDataModule.writeWidgetData(widgetDataJson);
      } else if (__DEV__) {
        await AsyncStorage.setItem('widget_habits', widgetDataJson);
      }
    }
  } catch (error) {
    if (__DEV__) {
      console.error('Error writing widget data:', error);
    }
  }
}
