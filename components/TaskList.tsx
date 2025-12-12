import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { TaskFrequency, useTasks } from '../context/TasksContext';

interface Task {
  id: string;
  name: string;
  streak: number;
  completedToday: boolean;
  emoji: string;
  frequency: TaskFrequency;
}

interface TaskListProps {
  tasks: Task[];
  showEmojis: boolean;
  onToggleTask: (id: string) => void;
  onRemoveTask: (id: string) => void;
}

export default function TaskList({ tasks, showEmojis, onToggleTask, onRemoveTask }: TaskListProps) {
  const { colors } = useTheme();
  const { toggleTask } = useTasks();

  const renderRightActions = (id: string) => {
    return (
      <TouchableOpacity
        style={[styles.deleteAction, { backgroundColor: colors.primary }]}
        onPress={() => onRemoveTask(id)}
      >
        <Ionicons name="trash" size={24} color="white" />
      </TouchableOpacity>
    );
  };

  if (tasks.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="list" size={64} color={colors.primary} />
        <Text style={[styles.emptyText, { color: colors.text }]}>
          No tasks yet. Tasks feature coming soon!
        </Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="auto" />
        <View style={styles.container}>
          <ScrollView style={styles.taskList}>
            {tasks.map((task) => (
              <Swipeable
                key={task.id}
                renderRightActions={() => renderRightActions(task.id)}
              >
                <View style={[styles.taskItem, { backgroundColor: colors.card }]}>
                  <View style={styles.taskInfo}>
                    {showEmojis && <Text style={styles.emoji}>{task.emoji}</Text>}
                    <View style={styles.taskDetails}>
                      <Text style={[styles.taskName, { color: colors.text }]}>{task.name}</Text>
                      <View style={styles.taskMeta}>
                        {task.frequency !== 'one-time' && (
                          <Text style={[styles.streakText, { color: colors.secondary }]}>
                            {task.streak} day streak 🔥
                          </Text>
                        )}
                        <Text style={[styles.frequencyText, { color: colors.secondary }]}>
                          {task.frequency === 'one-time' ? 'One Time' : 
                           task.frequency === 'daily' ? 'Daily' : 'Weekly'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.checkbox,
                      task.completedToday && { backgroundColor: colors.primary }
                    ]}
                    onPress={() => onToggleTask(task.id)}
                  >
                    {task.completedToday && (
                      <Ionicons name="checkmark" size={20} color="white" />
                    )}
                  </TouchableOpacity>
                </View>
              </Swipeable>
            ))}
          </ScrollView>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
 // STYLING
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  addFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFirstButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  taskList: {
    flex: 1,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  taskInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 24,
    marginRight: 12,
  },
  taskDetails: {
    flex: 1,
  },
  taskName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  streakText: {
    fontSize: 14,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  frequencyText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#cfcfcf',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
  },
}); 