import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
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

  // Load habits from Firestore when user is authenticated
  useEffect(() => {
    if (user) {
      loadHabitsFromFirestore();
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

  const loadHabitsFromFirestore = async () => {
    if (!user) return;
    
    try {
      const habitsQuery = query(
        collection(db, 'habit'),
        where('userId', '==', user.uid)
      );
      
      const querySnapshot = await getDocs(habitsQuery);
      const firestoreHabits: Habit[] = querySnapshot.docs.map(docSnapshot => {
        const data = docSnapshot.data();
        const today = new Date().toISOString().split('T')[0];
        const completionDates = data.completionDates || [];
        const isCompletedToday = completionDates.includes(today);
        
        return {
          id: docSnapshot.id,
          name: data.name,
          description: data.description,
          completed: isCompletedToday,
          userId: data.userId,
          createdAt: data.createdAt?.toDate() || new Date(),
          completedAt: data.completedAt?.toDate(),
          completionDates: completionDates,
        };
      });
      
      // Sort by createdAt to maintain consistent order (oldest first)
      // This will be the default order if no custom order is set
      const sortedHabits = firestoreHabits.sort((a, b) => 
        a.createdAt.getTime() - b.createdAt.getTime()
      );
      
      setHabits(sortedHabits);
    } catch (error) {
      // Fall back to local storage if Firestore fails
      const savedHabits = await AsyncStorage.getItem('habits');
      if (savedHabits) {
        const parsed = JSON.parse(savedHabits);
        // Ensure completionDates exists for backward compatibility
        const habitsWithDates = parsed.map((h: any) => ({
          ...h,
          completionDates: h.completionDates || [],
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
    const today = new Date().toISOString().split('T')[0];
    const updatedHabits = habits.map(habit => ({
      ...habit,
      completed: false,
      // Keep completionDates array for historical tracking
    }));

    // Update in Firestore
    try {
      const updatePromises = updatedHabits.map(habit =>
        updateDoc(doc(db, 'habit', habit.id), {
          completed: false,
        }).catch(() => {
          // Continue even if individual update fails
        })
      );
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error resetting habits in Firestore:', error);
    }

    setHabits(updatedHabits);
    await AsyncStorage.setItem('habits', JSON.stringify(updatedHabits));
  };

  const addHabit = async (name: string, description?: string) => {
    if (!user) return;
    
    try {
      const habitData = {
        name,
        description,
        completed: false,
        userId: user.uid,
        createdAt: new Date(),
        completionDates: [],
      };
      
      // Add to Firestore
      const docRef = await addDoc(collection(db, 'habit'), habitData);
      
      // Update local state
      const newHabit: Habit = {
        id: docRef.id,
        ...habitData,
        completionDates: [],
      };
      
      setHabits([...habits, newHabit]);
      
      // Also save to local storage as backup
      await AsyncStorage.setItem('habits', JSON.stringify([...habits, newHabit]));
    } catch (error) {
      // Fallback to local storage if Firestore fails
      const newHabit: Habit = {
        id: Date.now().toString(),
        name,
        description,
        completed: false,
        userId: user.uid,
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

    const updatedHabit = {
      ...habitToUpdate,
      name,
      description,
      // Preserve completionDates
      completionDates: habitToUpdate.completionDates || [],
    };

    // Update in Firestore
    try {
      await updateDoc(doc(db, 'habit', id), {
        name,
        description: description || null,
      });
    } catch (error) {
      // Firestore update failed, continue with local update
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

    const completed = dateStr === today ? !isCompleted : isCompleted;
    const completedAt = !isCompleted ? new Date() : undefined;

    const updatedHabit = {
      ...habitToUpdate,
      completed: dateStr === today ? completed : habitToUpdate.completed,
      completedAt,
      completionDates: newCompletionDates,
    };

    // Update in Firestore
    try {
      await updateDoc(doc(db, 'habit', id), {
        completed: dateStr === today ? completed : habitToUpdate.completed,
        completedAt: completedAt || null,
        completionDates: newCompletionDates,
      });
    } catch (error) {
      // Firestore update failed, continue with local update
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
      // Delete from Firestore
      await deleteDoc(doc(db, 'habit', id));
    } catch (error) {
      // Continue with local deletion even if Firestore fails
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
    
    // Note: We don't persist order to Firestore for now since it's a UI preference
    // If needed, we could add an 'order' field to each habit document
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

