import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface Task {
  id: string;
  name: string;
  streak: number;
  completedToday: boolean;
  emoji: string;
  lastCompletedDate: string | null; // ISO string of the last completion date
}

interface TasksContextType {
  tasks: Task[];
  showEmojis: boolean;
  isDarkMode: boolean;
  addTask: (name: string, emoji: string) => void;
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;
  toggleEmojis: () => void;
  toggleDarkMode: () => void;
}

const TasksContext = createContext<TasksContextType | undefined>(undefined);

export function TasksProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showEmojis, setShowEmojis] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load tasks from storage when the app starts
  useEffect(() => {
    loadTasks();
  }, []);

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
        saveTasks(newTasks);
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

  const loadTasks = async () => {
    try {
      const savedTasks = await AsyncStorage.getItem('tasks');
      const savedShowEmojis = await AsyncStorage.getItem('showEmojis');
      if (savedTasks) {
        setTasks(JSON.parse(savedTasks));
      }
      if (savedShowEmojis) {
        setShowEmojis(JSON.parse(savedShowEmojis));
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const saveTasks = async (newTasks: Task[]) => {
    try {
      await AsyncStorage.setItem('tasks', JSON.stringify(newTasks));
    } catch (error) {
      console.error('Error saving tasks:', error);
    }
  };

  const addTask = (name: string, emoji: string) => {
    const newTask: Task = {
      id: Date.now().toString(),
      name,
      streak: 0,
      completedToday: false,
      emoji,
      lastCompletedDate: null,
    };
    const newTasks = [...tasks, newTask];
    setTasks(newTasks);
    saveTasks(newTasks);
  };

  const toggleTask = (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    const newTasks = tasks.map((task) => {
      if (task.id === id) {
        const completedToday = !task.completedToday;
        const lastDate = task.lastCompletedDate ? new Date(task.lastCompletedDate) : null;
        const lastDateStr = lastDate ? lastDate.toISOString().split('T')[0] : null;
        
        let newStreak = task.streak;
        if (completedToday) {
          // If this is the first completion or the last completion was yesterday
          if (!lastDateStr || lastDateStr === today) {
            newStreak = task.streak + 1;
          }
        } else {
          // If unchecking today's completion, decrement streak
          newStreak = Math.max(0, task.streak - 1);
        }

        return {
          ...task,
          completedToday,
          streak: newStreak,
          lastCompletedDate: completedToday ? today : task.lastCompletedDate,
        };
      }
      return task;
    });
    setTasks(newTasks);
    saveTasks(newTasks);
  };

  const removeTask = (id: string) => {
    const newTasks = tasks.filter((task) => task.id !== id);
    setTasks(newTasks);
    saveTasks(newTasks);
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
    <TasksContext.Provider value={{ 
      tasks, 
      showEmojis,
      isDarkMode,
      addTask, 
      toggleTask, 
      removeTask,
      toggleEmojis,
      toggleDarkMode
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