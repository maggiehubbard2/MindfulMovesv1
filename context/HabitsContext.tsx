import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface Habit {
  id: string;
  name: string;
  description?: string;
  completed: boolean;
  userId: string;
  createdAt: Date;
  completedAt?: Date;
  goalId?: string;
}

interface HabitsContextType {
  habits: Habit[];
  addHabit: (name: string, description?: string, goalId?: string) => Promise<void>;
  toggleHabit: (id: string) => Promise<void>;
  removeHabit: (id: string) => Promise<void>;
}

const HabitsContext = createContext<HabitsContextType | undefined>(undefined);

export function HabitsProvider({ children }: { children: React.ReactNode }) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const { user } = useAuth();

  // Load habits from Firestore when user is authenticated
  useEffect(() => {
    if (user) {
      loadHabitsFromFirestore();
    } else {
      setHabits([]);
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
        return {
          id: docSnapshot.id,
          name: data.name,
          description: data.description,
          completed: data.completed || false,
          userId: data.userId,
          createdAt: data.createdAt?.toDate() || new Date(),
          completedAt: data.completedAt?.toDate(),
          goalId: data.goalId || undefined,
        };
      });
      
      setHabits(firestoreHabits);
    } catch (error) {
      // Fall back to local storage if Firestore fails
      const savedHabits = await AsyncStorage.getItem('habits');
      if (savedHabits) {
        setHabits(JSON.parse(savedHabits));
      }
    }
  };

  const addHabit = async (name: string, description?: string, goalId?: string) => {
    if (!user) return;
    
    try {
      const habitData = {
        name,
        description,
        completed: false,
        userId: user.uid,
        createdAt: new Date(),
        goalId: goalId || null,
      };
      
      // Add to Firestore
      const docRef = await addDoc(collection(db, 'habit'), habitData);
      
      // Update local state
      const newHabit: Habit = {
        id: docRef.id,
        ...habitData,
        goalId: goalId || undefined,
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
        goalId,
      };
      const newHabits = [...habits, newHabit];
      setHabits(newHabits);
      await AsyncStorage.setItem('habits', JSON.stringify(newHabits));
    }
  };

  const toggleHabit = async (id: string) => {
    const habitToUpdate = habits.find(habit => habit.id === id);
    if (!habitToUpdate) return;

    const completed = !habitToUpdate.completed;
    const completedAt = completed ? new Date() : undefined;

    const updatedHabit = {
      ...habitToUpdate,
      completed,
      completedAt,
    };

    // Update in Firestore
    try {
      await updateDoc(doc(db, 'habit', id), {
        completed,
        completedAt: completedAt || null,
      });
    } catch (error) {
      // Firestore update failed, continue with local update
    }

    // Update local state
    const newHabits = habits.map((habit) => habit.id === id ? updatedHabit : habit);
    setHabits(newHabits);
    await AsyncStorage.setItem('habits', JSON.stringify(newHabits));
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

  return (
    <HabitsContext.Provider value={{ habits, addHabit, toggleHabit, removeHabit }}>
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

