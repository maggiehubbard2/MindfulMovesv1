import React, { createContext, useContext, useState } from 'react';

interface Habit {
  id: string;
  name: string;
  streak: number;
  completedToday: boolean;
  emoji: string;
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

  const addHabit = (name: string, emoji: string) => {
    setHabits([
      ...habits,
      {
        id: Date.now().toString(),
        name,
        streak: 0,
        completedToday: false,
        emoji,
      },
    ]);
  };

  const toggleHabit = (id: string) => {
    setHabits(habits.map(habit => {
      if (habit.id === id) {
        const completedToday = !habit.completedToday;
        return {
          ...habit,
          completedToday,
          streak: completedToday ? habit.streak + 1 : habit.streak,
        };
      }
      return habit;
    }));
  };

  const removeHabit = (id: string) => {
    setHabits(habits.filter(habit => habit.id !== id));
  };

  const toggleEmojis = () => {
    setShowEmojis(!showEmojis);
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