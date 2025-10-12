import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';

export type TaskFrequency = 'one-time' | 'daily' | 'monthly';

interface Task {
  id: string;
  name: string;
  streak: number;
  completedToday: boolean;
  emoji: string;
  lastCompletedDate: string | null; // ISO string of the last completion date
  userId: string; // Owner of the task
  createdAt: Date;
  habitId?: string; // Optional reference to a related habit
  frequency: TaskFrequency; // How often this task should be done
  completionDates: string[]; // Array of ISO date strings when task was completed
}

interface TasksContextType {
  tasks: Task[];
  showEmojis: boolean;
  isDarkMode: boolean;
  addTask: (name: string, emoji: string, frequency: TaskFrequency, habitId?: string) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  removeTask: (id: string) => Promise<void>;
  toggleEmojis: () => void;
  toggleDarkMode: () => void;
  resetDailyTasks: () => void;
  getActiveTasksForDate: (date: Date) => Task[];
}

const TasksContext = createContext<TasksContextType | undefined>(undefined);

export function TasksProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showEmojis, setShowEmojis] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { user } = useAuth();

  // Load tasks from Firestore when user is authenticated
  useEffect(() => {
    if (user) {
      loadTasksFromFirestore();
    } else {
      setTasks([]);
    }
  }, [user]);

  // Check and update streaks daily
  useEffect(() => {
    const checkStreaks = () => {
      const today = new Date().toISOString().split('T')[0];
      const newTasks = tasks.map(task => {
        if (!task.lastCompletedDate) return task;
        
        const lastDate = new Date(task.lastCompletedDate);
        const lastDateStr = lastDate.toISOString().split('T')[0];
        
        // If the last completion was not yesterday, reset the streak
        if (lastDateStr !== today && !task.completedToday) {
          return {
            ...task,
            streak: 0,
            completedToday: false
          };
        }
        return task;
      });
      
      if (JSON.stringify(newTasks) !== JSON.stringify(tasks)) {
        setTasks(newTasks);
        AsyncStorage.setItem('tasks', JSON.stringify(newTasks)).catch(console.error);
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
  }, [tasks]);

  // Check and reset daily tasks when date changes
  useEffect(() => {
    const checkAndResetTasks = async () => {
      const today = new Date().toISOString().split('T')[0];
      const lastCheck = await AsyncStorage.getItem('lastTaskCheck');
      
      if (lastCheck !== today) {
        resetDailyTasks();
        AsyncStorage.setItem('lastTaskCheck', today).catch(console.error);
      }
    };
    
    checkAndResetTasks();
  }, []);

  const loadTasksFromFirestore = async () => {
    if (!user) return;
    
    try {
      const tasksQuery = query(
        collection(db, 'task'),
        where('userId', '==', user.uid)
      );
      
      const querySnapshot = await getDocs(tasksQuery);
      const firestoreTasks: Task[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          streak: data.streak || 0,
          completedToday: data.completedToday || false,
          emoji: data.emoji,
          lastCompletedDate: data.lastCompletedDate || null,
          userId: data.userId,
          createdAt: data.createdAt?.toDate() || new Date(),
          habitId: data.habitId,
          frequency: data.frequency || 'one-time', // Default to 'one-time' for existing tasks
          completionDates: data.completionDates || [], // Default to empty array for existing tasks
        };
      });
      
      setTasks(firestoreTasks);
      
      // Also load emoji preference
      const savedShowEmojis = await AsyncStorage.getItem('showEmojis');
      if (savedShowEmojis) {
        setShowEmojis(JSON.parse(savedShowEmojis));
      }
    } catch (error) {
      // Fall back to local storage if Firestore fails
      const savedTasks = await AsyncStorage.getItem('tasks');
      if (savedTasks) {
        setTasks(JSON.parse(savedTasks));
      }
    }
  };

  const addTask = async (name: string, emoji: string, frequency: TaskFrequency, habitId?: string) => {
    if (!user) return;
    
    try {
      const taskData = {
        name,
        streak: 0,
        completedToday: false,
        emoji,
        lastCompletedDate: null,
        userId: user.uid,
        createdAt: new Date(),
        habitId: habitId || undefined,
        frequency,
        completionDates: [],
      };
      
      // Add to Firestore
      const docRef = await addDoc(collection(db, 'task'), taskData);
      
      // Update local state
      const newTask: Task = {
        id: docRef.id,
        ...taskData,
      };
      
      setTasks([...tasks, newTask]);
      
      // Also save to local storage as backup
      await AsyncStorage.setItem('tasks', JSON.stringify([...tasks, newTask]));
    } catch (error) {
      // Fallback to local storage if Firestore fails
      const newTask: Task = {
        id: Date.now().toString(),
        name,
        streak: 0,
        completedToday: false,
        emoji,
        lastCompletedDate: null,
        userId: user.uid,
        createdAt: new Date(),
        habitId: habitId,
        frequency,
        completionDates: [],
      };
      const newTasks = [...tasks, newTask];
      setTasks(newTasks);
      await AsyncStorage.setItem('tasks', JSON.stringify(newTasks));
    }
  };

  const toggleTask = async (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    const taskToUpdate = tasks.find(task => task.id === id);
    if (!taskToUpdate) return;

    const completedToday = !taskToUpdate.completedToday;
    const lastDate = taskToUpdate.lastCompletedDate ? new Date(taskToUpdate.lastCompletedDate) : null;
    const lastDateStr = lastDate ? lastDate.toISOString().split('T')[0] : null;
    
    let newStreak = taskToUpdate.streak;
    let newCompletionDates = [...(taskToUpdate.completionDates || [])];
    
    if (completedToday) {
      // Add today to completion dates if not already present
      if (!newCompletionDates.includes(today)) {
        newCompletionDates.push(today);
      }
      // If this is the first completion or the last completion was yesterday
      if (!lastDateStr || lastDateStr === today) {
        newStreak = taskToUpdate.streak + 1;
      }
    } else {
      // Remove today from completion dates
      newCompletionDates = newCompletionDates.filter(date => date !== today);
      // If unchecking today's completion, decrement streak
      newStreak = Math.max(0, taskToUpdate.streak - 1);
    }

    const updatedTask = {
      ...taskToUpdate,
      completedToday,
      streak: newStreak,
      lastCompletedDate: completedToday ? today : taskToUpdate.lastCompletedDate,
      completionDates: newCompletionDates,
    };

    // Update in Firestore
    try {
      await updateDoc(doc(db, 'task', id), {
        completedToday,
        streak: newStreak,
        lastCompletedDate: completedToday ? today : taskToUpdate.lastCompletedDate,
        completionDates: newCompletionDates,
      });
    } catch (error) {
      // Firestore update failed, continue with local update
    }

    // Update local state
    const newTasks = tasks.map((task) => task.id === id ? updatedTask : task);
    setTasks(newTasks);
    await AsyncStorage.setItem('tasks', JSON.stringify(newTasks));
  };

  const removeTask = async (id: string) => {
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'task', id));
    } catch (error) {
      // Continue with local deletion even if Firestore fails
    }

    // Update local state
    const newTasks = tasks.filter((task) => task.id !== id);
    setTasks(newTasks);
    await AsyncStorage.setItem('tasks', JSON.stringify(newTasks));
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

  const resetDailyTasks = () => {
    const today = new Date().toISOString().split('T')[0];
    const updatedTasks = tasks.map(task => {
      if (task.frequency === 'daily') {
        return {
          ...task,
          completedToday: false,
        };
      }
      return task;
    });
    setTasks(updatedTasks);
    AsyncStorage.setItem('tasks', JSON.stringify(updatedTasks)).catch(console.error);
  };

  const getActiveTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      switch (task.frequency) {
        case 'one-time':
          // Show if not completed today
          const dateStr = date.toISOString().split('T')[0];
          return !task.completionDates?.includes(dateStr);
        case 'daily':
          // Always show daily tasks
          return true;
        case 'monthly':
          // Show only on matching day of month
          const taskDay = new Date(task.createdAt).getDate();
          return date.getDate() === taskDay;
        default:
          return true;
      }
    });
  };

  return (
    <TasksContext.Provider value={{ 
      tasks, 
      showEmojis,
      isDarkMode,
      addTask, 
      toggleTask, 
      removeTask,
      toggleEmojis,
      toggleDarkMode,
      resetDailyTasks,
      getActiveTasksForDate
    }}>
      {children}
    </TasksContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TasksContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TasksProvider');
  }
  return context;
} 