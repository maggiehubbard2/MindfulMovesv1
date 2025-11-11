import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    query,
    updateDoc,
    where,
} from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';

export interface Goal {
  id: string;
  title: string;
  description?: string;
  why?: string;
  userId: string;
  createdAt: Date;
}

interface GoalsContextType {
  goals: Goal[];
  addGoal: (data: { title: string; description?: string; why?: string }) => Promise<void>;
  updateGoal: (id: string, data: Partial<Omit<Goal, 'id' | 'userId' | 'createdAt'>>) => Promise<void>;
  removeGoal: (id: string) => Promise<void>;
}

const GoalsContext = createContext<GoalsContextType | undefined>(undefined);

export function GoalsProvider({ children }: { children: React.ReactNode }) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadGoalsFromFirestore();
    } else {
      setGoals([]);
    }
  }, [user]);

  const hydrateGoal = (raw: any): Goal => ({
    id: raw.id,
    title: raw.title,
    description: raw.description,
    why: raw.why,
    userId: raw.userId,
    createdAt: raw.createdAt instanceof Date ? raw.createdAt : new Date(raw.createdAt),
  });

  const loadGoalsFromFirestore = async () => {
    if (!user) return;

    try {
      const goalsQuery = query(collection(db, 'goals'), where('userId', '==', user.uid));
      const snapshot = await getDocs(goalsQuery);
      const firestoreGoals: Goal[] = snapshot.docs.map((docSnapshot) => {
        const data = docSnapshot.data();
        return {
          id: docSnapshot.id,
          title: data.title,
          description: data.description,
          why: data.why,
          userId: data.userId,
          createdAt: data.createdAt?.toDate() || new Date(),
        };
      });
      setGoals(firestoreGoals);
    } catch (error) {
      const savedGoals = await AsyncStorage.getItem('goals');
      if (savedGoals) {
        const parsed: Goal[] = JSON.parse(savedGoals).map(hydrateGoal);
        setGoals(parsed);
      }
    }
  };

  const persistGoals = async (nextGoals: Goal[]) => {
    setGoals(nextGoals);
    await AsyncStorage.setItem('goals', JSON.stringify(nextGoals));
  };

  const addGoal: GoalsContextType['addGoal'] = async ({ title, description, why }) => {
    if (!user) return;

    const goalData = {
      title,
      description,
      why,
      userId: user.uid,
      createdAt: new Date(),
    };

    try {
      const docRef = await addDoc(collection(db, 'goals'), goalData);
      const newGoal: Goal = { id: docRef.id, ...goalData };
      await persistGoals([...goals, newGoal]);
    } catch (error) {
      const fallbackGoal: Goal = {
        id: Date.now().toString(),
        ...goalData,
      };
      await persistGoals([...goals, fallbackGoal]);
    }
  };

  const updateGoal: GoalsContextType['updateGoal'] = async (id, data) => {
    const targetGoal = goals.find((goal) => goal.id === id);
    if (!targetGoal) return;

    const updatedGoal: Goal = {
      ...targetGoal,
      ...data,
    };

    try {
      await updateDoc(doc(db, 'goals', id), {
        title: updatedGoal.title,
        description: updatedGoal.description ?? null,
        why: updatedGoal.why ?? null,
      });
    } catch (error) {
      // ignore, persist locally
    }

    const nextGoals = goals.map((goal) => (goal.id === id ? updatedGoal : goal));
    await persistGoals(nextGoals);
  };

  const removeGoal: GoalsContextType['removeGoal'] = async (id) => {
    try {
      await deleteDoc(doc(db, 'goals', id));
    } catch (error) {
      // ignore failures for local removal
    }

    const nextGoals = goals.filter((goal) => goal.id !== id);
    await persistGoals(nextGoals);
  };

  return (
    <GoalsContext.Provider value={{ goals, addGoal, updateGoal, removeGoal }}>
      {children}
    </GoalsContext.Provider>
  );
}

export function useGoals() {
  const context = useContext(GoalsContext);
  if (!context) {
    throw new Error('useGoals must be used within a GoalsProvider');
  }
  return context;
}


