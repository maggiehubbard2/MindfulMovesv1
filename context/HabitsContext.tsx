import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface Habit {
  id: string;
  name: string;
  streak: number;
  completedToday: boolean;
  emoji: string;
  lastCompletedDate: string | null; // ISO string of the last completion date
}

interface HabitsContextType {
  habits: Habit[];
  showEmojis: boolean;
  isDarkMode: boolean;
  addHabit: (name: string, emoji: string) => void;
  toggleHabit: (id: string) => void;
  removeHabit: (id: string) => void;
  toggleEmojis: () => void;
  toggleDarkMode: () => void;
}

const HabitsContext = createContext<HabitsContextType | undefined>(undefined);

export function HabitsProvider({ children }: { children: React.ReactNode }) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [showEmojis, setShowEmojis] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load habits from storage when the app starts
  useEffect(() => {
    loadHabits();
  }, []);

  // Check and update streaks daily
  useEffect(() => {
    const checkStreaks = () => {
      const today = new Date().toISOString().split('T')[0];
      const newHabits = habits.map(habit => {
        if (!habit.lastCompletedDate) return habit;
        
        const lastDate = new Date(habit.lastCompletedDate);
        const lastDateStr = lastDate.toISOString().split('T')[0];
        
        // If the last completion was not yesterday, reset the streak
        if (lastDateStr !== today && !habit.completedToday) {
          return {
            ...habit,
            streak: 0,
            completedToday: false
          };
        }
        return habit;
      });
      
      if (JSON.stringify(newHabits) !== JSON.stringify(habits)) {
        setHabits(newHabits);
        saveHabits(newHabits);
      }
    };

    // Check streaks when the app starts
    checkStreaks();

    // Set up daily check at midnight
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();

    const timer = setTimeout(() => {
      checkStreaks();
      // Set up recurring daily check
      setInterval(checkStreaks, 24 * 60 * 60 * 1000);
    }, timeUntilMidnight);

    return () => clearTimeout(timer);
  }, [habits]);

  const loadHabits = async () => {
    try {
      const savedHabits = await AsyncStorage.getItem('habits');
      const savedShowEmojis = await AsyncStorage.getItem('showEmojis');
      if (savedHabits) {
        setHabits(JSON.parse(savedHabits));
      }
      if (savedShowEmojis) {
        setShowEmojis(JSON.parse(savedShowEmojis));
      }
    } catch (error) {
      console.error('Error loading habits:', error);
    }
  };

  const saveHabits = async (newHabits: Habit[]) => {
    try {
      await AsyncStorage.setItem('habits', JSON.stringify(newHabits));
    } catch (error) {
      console.error('Error saving habits:', error);
    }
  };

  const addHabit = (name: string, emoji: string) => {
    const newHabit: Habit = {
      id: Date.now().toString(),
      name,
      streak: 0,
      completedToday: false,
      emoji,
      lastCompletedDate: null,
    };
    const newHabits = [...habits, newHabit];
    setHabits(newHabits);
    saveHabits(newHabits);
  };

  const toggleHabit = (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    const newHabits = habits.map((habit) => {
      if (habit.id === id) {
        const completedToday = !habit.completedToday;
        const lastDate = habit.lastCompletedDate ? new Date(habit.lastCompletedDate) : null;
        const lastDateStr = lastDate ? lastDate.toISOString().split('T')[0] : null;
        
        let newStreak = habit.streak;
        if (completedToday) {
          // If this is the first completion or the last completion was yesterday
          if (!lastDateStr || lastDateStr === today) {
            newStreak = habit.streak + 1;
          }
        } else {
          // If unchecking today's completion, decrement streak
          newStreak = Math.max(0, habit.streak - 1);
        }

        return {
          ...habit,
          completedToday,
          streak: newStreak,
          lastCompletedDate: completedToday ? today : habit.lastCompletedDate,
        };
      }
      return habit;
    });
    setHabits(newHabits);
    saveHabits(newHabits);
  };

  const removeHabit = (id: string) => {
    const newHabits = habits.filter((habit) => habit.id !== id);
    setHabits(newHabits);
    saveHabits(newHabits);
  };

  const toggleEmojis = async () => {
    const newShowEmojis = !showEmojis;
    setShowEmojis(newShowEmojis);
    try {
      await AsyncStorage.setItem('showEmojis', JSON.stringify(newShowEmojis));
    } catch (error) {
      console.error('Error saving emoji preference:', error);
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <HabitsContext.Provider value={{ 
      habits, 
      showEmojis,
      isDarkMode,
      addHabit, 
      toggleHabit, 
      removeHabit,
      toggleEmojis,
      toggleDarkMode
    }}>
      {children}
    </HabitsContext.Provider>
  );
}

export function useHabits() {
  const context = useContext(HabitsContext);
  if (context === undefined) {
    throw new Error('useHabits must be used within a HabitsProvider');
  }
  return context;
} 