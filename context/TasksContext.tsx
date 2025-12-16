import { supabase } from '@/config/supabase';
import { useAuth } from '@/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

export type TaskFrequency = 'one-time' | 'daily' | 'monthly';

interface Task {
  id: string;
  name: string;
  streak: number;
  completed_today: boolean;
  emoji: string;
  last_completed_date: string | null; // ISO string of the last completion date
  user_id: string; // Owner of the task
  created_at: string;
  habit_id?: string; // Optional reference to a related habit
  frequency: TaskFrequency; // How often this task should be done
  completion_dates: string[]; // Array of ISO date strings when task was completed
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

  // Load tasks from Supabase when user is authenticated
  useEffect(() => {
    if (user) {
      loadTasksFromSupabase();
    } else {
      setTasks([]);
    }
  }, [user]);

  // Check and update streaks daily
  useEffect(() => {
    const checkStreaks = () => {
      const today = new Date().toISOString().split('T')[0];
      const newTasks = tasks.map(task => {
        if (!task.last_completed_date) return task;
        
        const lastDate = new Date(task.last_completed_date);
        const lastDateStr = lastDate.toISOString().split('T')[0];
        
        // If the last completion was not yesterday, reset the streak
        if (lastDateStr !== today && !task.completed_today) {
          return {
            ...task,
            streak: 0,
            completed_today: false
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

  const loadTasksFromSupabase = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('task')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      const supabaseTasks: Task[] = (data || []).map((task: any) => ({
        id: task.id,
        name: task.name,
        streak: task.streak || 0,
        completed_today: task.completed_today || false,
        emoji: task.emoji,
        last_completed_date: task.last_completed_date || null,
        user_id: task.user_id,
        created_at: task.created_at,
        habit_id: task.habit_id,
        frequency: task.frequency || 'one-time',
        completion_dates: task.completion_dates || [],
      }));
      
      setTasks(supabaseTasks);
      
      // Also load emoji preference
      const savedShowEmojis = await AsyncStorage.getItem('showEmojis');
      if (savedShowEmojis) {
        setShowEmojis(JSON.parse(savedShowEmojis));
      }
    } catch (error) {
      console.error('Error loading tasks from Supabase:', error);
      // Fall back to local storage if Supabase fails
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
        completed_today: false,
        emoji,
        last_completed_date: null,
        user_id: user.id,
        created_at: new Date().toISOString(),
        habit_id: habitId || null,
        frequency,
        completion_dates: [],
      };
      
      // Add to Supabase
      const { data, error } = await supabase
        .from('task')
        .insert([taskData])
        .select()
        .single();
      
      if (error) throw error;
      
      // Update local state
      const newTask: Task = {
        id: data.id,
        ...data,
      };
      
      setTasks([...tasks, newTask]);
      
      // Also save to local storage as backup
      await AsyncStorage.setItem('tasks', JSON.stringify([...tasks, newTask]));
    } catch (error) {
      console.error('Error adding task to Supabase:', error);
      // Fallback to local storage if Supabase fails
      const newTask: Task = {
        id: Date.now().toString(),
        name,
        streak: 0,
        completed_today: false,
        emoji,
        last_completed_date: null,
        user_id: user.id,
        created_at: new Date().toISOString(),
        habit_id: habitId,
        frequency,
        completion_dates: [],
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

    const completedToday = !taskToUpdate.completed_today;
    const lastDate = taskToUpdate.last_completed_date ? new Date(taskToUpdate.last_completed_date) : null;
    const lastDateStr = lastDate ? lastDate.toISOString().split('T')[0] : null;
    
    let newStreak = taskToUpdate.streak;
    let newCompletionDates = [...(taskToUpdate.completion_dates || [])];
    
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
      completed_today: completedToday,
      streak: newStreak,
      last_completed_date: completedToday ? today : taskToUpdate.last_completed_date,
      completion_dates: newCompletionDates,
    };

    // Update in Supabase
    try {
      const { error } = await supabase
        .from('task')
        .update({
          completed_today: completedToday,
          streak: newStreak,
          last_completed_date: completedToday ? today : taskToUpdate.last_completed_date,
          completion_dates: newCompletionDates,
        })
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error updating task in Supabase:', error);
      // Supabase update failed, continue with local update
    }

    // Update local state
    const newTasks = tasks.map((task) => task.id === id ? updatedTask : task);
    setTasks(newTasks);
    await AsyncStorage.setItem('tasks', JSON.stringify(newTasks));
  };

  const removeTask = async (id: string) => {
    try {
      // Delete from Supabase
      const { error } = await supabase
        .from('task')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting task from Supabase:', error);
      // Continue with local deletion even if Supabase fails
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
    const updatedTasks = tasks.map(task => {
      if (task.frequency === 'daily') {
        return {
          ...task,
          completed_today: false,
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
          return !task.completion_dates?.includes(dateStr);
        case 'daily':
          // Always show daily tasks
          return true;
        case 'monthly':
          // Show only on matching day of month
          const taskDay = new Date(task.created_at).getDate();
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
