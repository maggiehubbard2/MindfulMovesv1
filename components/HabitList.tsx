import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/Swipeable';

interface Habit {
  id: string;
  name: string;
  streak: number;
  completedToday: boolean;
  emoji: string;
}

interface HabitListProps {
  habits: Habit[];
  showEmojis: boolean;
  onToggleHabit: (id: string) => void;
  onRemoveHabit: (id: string) => void;
}

const renderRightActions = (onDelete: () => void) => {
  return (
    <TouchableOpacity
      style={styles.deleteAction}
      onPress={onDelete}
    >
      <Ionicons name="trash" size={24} color="white" />
    </TouchableOpacity>
  );
};

export default function HabitList({ habits, showEmojis, onToggleHabit, onRemoveHabit }: HabitListProps) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="auto" />
        <View style={styles.container}>
          {habits.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="list" size={64} color="#007AFF" />
              <Text style={styles.emptyStateTitle}>No Habits Yet</Text>
              <Text style={styles.emptyStateText}>
                Start building your habits by adding your first one!
              </Text>
              <Link href="/add" asChild>
                <TouchableOpacity style={styles.addFirstButton}>
                  <Ionicons name="add" size={24} color="white" />
                  <Text style={styles.addFirstButtonText}>Add Your First Habit</Text>
                </TouchableOpacity>
              </Link>
            </View>
          ) : (
            <ScrollView style={styles.habitList}>
              {habits.map(habit => (
                <Swipeable
                  key={habit.id}
                  renderRightActions={() => renderRightActions(() => onRemoveHabit(habit.id))}
                >
                  <View style={styles.habitItem}>
                    {showEmojis && <Text style={styles.emoji}>{habit.emoji}</Text>}
                    <View style={styles.habitInfo}>
                      <Text style={styles.habitName}>{habit.name}</Text>
                      <Text style={styles.streakText}>🔥 {habit.streak} day streak</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.checkbox, habit.completedToday && styles.checked]}
                      onPress={() => onToggleHabit(habit.id)}
                    >
                      {habit.completedToday && (
                        <Ionicons name="checkmark" size={20} color="white" />
                      )}
                    </TouchableOpacity>
                  </View>
                </Swipeable>
              ))}
            </ScrollView>
          )}
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
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
  habitList: {
    flex: 1,
  },
  habitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
  },
  emoji: {
    fontSize: 32,
    marginRight: 12,
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  streakText: {
    fontSize: 14,
    color: '#666',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checked: {
    backgroundColor: '#007AFF',
  },
  deleteAction: {
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
  },
}); 