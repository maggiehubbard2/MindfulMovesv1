import { supabase } from '@/config/supabase';
import { useAuth } from '@/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface Habit {
  id: string;
  name: string;
  description?: string;
  completed: boolean; // Current day completion status
  userId: string;
  createdAt: Date;
  completedAt?: Date; // Last completion timestamp
  completionDates: string[]; // Array of ISO date strings (YYYY-MM-DD) when habit was completed
}

interface HabitsContextType {
  habits: Habit[];
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  addHabit: (name: string, description?: string) => Promise<void>;
  updateHabit: (id: string, name: string, description?: string) => Promise<void>;
  toggleHabit: (id: string, date?: Date) => Promise<void>;
  removeHabit: (id: string) => Promise<void>;
  reorderHabits: (fromIndex: number, toIndex: number) => Promise<void>;
  getHabitsForDate: (date: Date) => Habit[];
  canEditDate: (date: Date) => boolean;
  resetHabitsForNewDay: () => Promise<void>;
}

const HabitsContext = createContext<HabitsContextType | undefined>(undefined);

export function HabitsProvider({ children }: { children: React.ReactNode }) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { user } = useAuth();

  // Load habits from Supabase when user is authenticated
  useEffect(() => {
    if (user) {
      loadHabitsFromSupabase();
      checkAndResetHabits();
    } else {
      setHabits([]);
    }
  }, [user]);

  // Check for midnight reset on mount and when date changes
  useEffect(() => {
    if (user) {
      checkAndResetHabits();
      // Set up interval to check for midnight reset every minute
      const interval = setInterval(() => {
        checkAndResetHabits();
      }, 60000); // Check every minute
      
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadHabitsFromSupabase = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('habit')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      const today = new Date().toISOString().split('T')[0];
      const supabaseHabits: Habit[] = (data || []).map((habit: any) => {
        const completionDates = habit.completion_dates || [];
        const isCompletedToday = completionDates.includes(today);
        
        return {
          id: habit.id,
          name: habit.name,
          description: habit.description || undefined,
          completed: isCompletedToday,
          userId: habit.user_id,
          createdAt: new Date(habit.created_at),
          completedAt: habit.completed_at ? new Date(habit.completed_at) : undefined,
          completionDates: completionDates,
        };
      });
      
      setHabits(supabaseHabits);
    } catch (error) {
      console.error('Error loading habits from Supabase:', error);
      // Fall back to local storage if Supabase fails
      const savedHabits = await AsyncStorage.getItem('habits');
      if (savedHabits) {
        const parsed = JSON.parse(savedHabits);
        // Ensure completionDates exists for backward compatibility
        const habitsWithDates = parsed.map((h: any) => ({
          ...h,
          completionDates: h.completionDates || h.completion_dates || [],
          createdAt: h.createdAt ? new Date(h.createdAt) : new Date(),
        }));
        setHabits(habitsWithDates);
      }
    }
  };

  // Check if we need to reset habits for a new day
  const checkAndResetHabits = async () => {
    if (!user) return;
    
    const lastResetDate = await AsyncStorage.getItem('lastHabitResetDate');
    const today = new Date().toISOString().split('T')[0];
    
    if (lastResetDate !== today) {
      await resetHabitsForNewDay();
      await AsyncStorage.setItem('lastHabitResetDate', today);
    }
  };

  // Reset habits for new day - archive completions but keep habit definitions
  const resetHabitsForNewDay = async () => {
    if (!user) return;
    
    // Update all habits to reset completed status for today
    const updatedHabits = habits.map(habit => ({
      ...habit,
      completed: false,
      // Keep completionDates array for historical tracking
    }));

    // Update in Supabase
    try {
      const updatePromises = updatedHabits.map(habit =>
        supabase
          .from('habit')
          .update({ completed: false })
          .eq('id', habit.id)
          .then(({ error }) => {
            if (error) {
              console.error(`Error resetting habit ${habit.id}:`, error);
            }
          })
      );
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error resetting habits in Supabase:', error);
    }

    setHabits(updatedHabits);
    await AsyncStorage.setItem('habits', JSON.stringify(updatedHabits));
  };

  const addHabit = async (name: string, description?: string) => {
    if (!user) return;
    
    try {
      const habitData = {
        name,
        description: description || null,
        completed: false,
        user_id: user.id,
        created_at: new Date().toISOString(),
        completion_dates: [],
      };
      
      // Add to Supabase
      const { data, error } = await supabase
        .from('habit')
        .insert([habitData])
        .select()
        .single();
      
      if (error) throw error;
      
      // Update local state (transform to camelCase)
      const newHabit: Habit = {
        id: data.id,
        name: data.name,
        description: data.description,
        completed: data.completed,
        userId: data.user_id,
        createdAt: new Date(data.created_at),
        completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
        completionDates: data.completion_dates || [],
      };
      
      setHabits([...habits, newHabit]);
      
      // Also save to local storage as backup
      await AsyncStorage.setItem('habits', JSON.stringify([...habits, newHabit]));
    } catch (error) {
      console.error('Error adding habit to Supabase:', error);
      // Fallback to local storage if Supabase fails
      const newHabit: Habit = {
        id: Date.now().toString(),
        name,
        description,
        completed: false,
        userId: user.id,
        createdAt: new Date(),
        completionDates: [],
      };
      const newHabits = [...habits, newHabit];
      setHabits(newHabits);
      await AsyncStorage.setItem('habits', JSON.stringify(newHabits));
    }
  };

  const updateHabit = async (id: string, name: string, description?: string) => {
    const habitToUpdate = habits.find(habit => habit.id === id);
    if (!habitToUpdate) return;

    const updatedHabit: Habit = {
      ...habitToUpdate,
      name,
      description: description || undefined,
      // Preserve completionDates
      completionDates: habitToUpdate.completionDates || [],
    };

    // Update in Supabase
    try {
      const { error } = await supabase
        .from('habit')
        .update({
          name,
          description: description || null, // Supabase uses null, but we convert to undefined in our types
        })
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error updating habit in Supabase:', error);
      // Supabase update failed, continue with local update
    }

    // Update local state
    const newHabits = habits.map((habit) => habit.id === id ? updatedHabit : habit);
    setHabits(newHabits);
    await AsyncStorage.setItem('habits', JSON.stringify(newHabits));
  };

  const toggleHabit = async (id: string, date?: Date) => {
    const habitToUpdate = habits.find(habit => habit.id === id);
    if (!habitToUpdate) return;

    const targetDate = date || selectedDate;
    const dateStr = targetDate.toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    
    // Check if we can edit this date
    if (!canEditDate(targetDate)) {
      return; // Silently fail if date is not editable
    }

    const completionDates = habitToUpdate.completionDates || [];
    const isCompleted = completionDates.includes(dateStr);
    const newCompletionDates = isCompleted
      ? completionDates.filter(d => d !== dateStr)
      : [...completionDates, dateStr];

    // Update completed status based on whether the date is in the new completion dates
    const newIsCompleted = newCompletionDates.includes(dateStr);
    const completed = dateStr === today ? newIsCompleted : habitToUpdate.completed;
    const completedAt = newIsCompleted ? new Date().toISOString() : (dateStr === today ? undefined : habitToUpdate.completedAt);

    const updatedHabit: Habit = {
      ...habitToUpdate,
      description: habitToUpdate.description || undefined,
      completed,
      completedAt: completedAt ? new Date(completedAt) : undefined,
      completionDates: newCompletionDates,
    };

    // Update in Supabase
    try {
      const { error } = await supabase
        .from('habit')
        .update({
          completed: dateStr === today ? completed : habitToUpdate.completed,
          completed_at: completedAt || null,
          completion_dates: newCompletionDates,
        })
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error updating habit in Supabase:', error);
      // Supabase update failed, continue with local update
    }

    // Update local state
    const newHabits = habits.map((habit) => habit.id === id ? updatedHabit : habit);
    setHabits(newHabits);
    await AsyncStorage.setItem('habits', JSON.stringify(newHabits));
  };

  // Get habits for a specific date (with completion status for that date)
  const getHabitsForDate = (date: Date): Habit[] => {
    const dateStr = date.toISOString().split('T')[0];
    return habits.map(habit => {
      const isCompleted = (habit.completionDates || []).includes(dateStr);
      return {
        ...habit,
        completed: isCompleted,
      };
    });
  };

  // Check if a date can be edited (only up to 2 days prior, no future dates)
  const canEditDate = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    // Cannot edit future dates
    if (targetDate > today) {
      return false;
    }
    
    // Can edit today and up to 2 days prior
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    return targetDate >= twoDaysAgo;
  };

  const removeHabit = async (id: string) => {
    try {
      // Delete from Supabase
      const { error } = await supabase
        .from('habit')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting habit from Supabase:', error);
      // Continue with local deletion even if Supabase fails
    }

    // Update local state
    const newHabits = habits.filter((habit) => habit.id !== id);
    setHabits(newHabits);
    await AsyncStorage.setItem('habits', JSON.stringify(newHabits));
  };

  const reorderHabits = async (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    
    const newHabits = [...habits];
    const [movedHabit] = newHabits.splice(fromIndex, 1);
    newHabits.splice(toIndex, 0, movedHabit);
    
    setHabits(newHabits);
    await AsyncStorage.setItem('habits', JSON.stringify(newHabits));
    
    // Note: We don't persist order to Supabase for now since it's a UI preference
    // If needed, we could add an 'order' field to each habit row
  };

  return (
    <HabitsContext.Provider value={{ 
      habits, 
      selectedDate,
      setSelectedDate,
      addHabit, 
      updateHabit, 
      toggleHabit, 
      removeHabit,
      reorderHabits,
      getHabitsForDate,
      canEditDate,
      resetHabitsForNewDay,
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
