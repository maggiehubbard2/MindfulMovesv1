import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { useHabits } from '../context/HabitsContext';

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

export default function HabitList({ habits, showEmojis, onToggleHabit, onRemoveHabit }: HabitListProps) {
  const { colors } = useTheme();
  const { toggleHabit } = useHabits();

  const renderRightActions = (id: string) => {
    return (
      <TouchableOpacity
        style={[styles.deleteAction, { backgroundColor: colors.primary }]}
        onPress={() => onRemoveHabit(id)}
      >
        <Ionicons name="trash" size={24} color="white" />
      </TouchableOpacity>
    );
  };

  if (habits.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="list" size={64} color={colors.primary} />
        <Text style={[styles.emptyText, { color: colors.text }]}>
          No habits yet. Add your first habit!
        </Text>
        <Link href="/add" asChild>
          <TouchableOpacity style={styles.addFirstButton}>
            <Ionicons name="add" size={24} color="white" />
            <Text style={styles.addFirstButtonText}>Add Your First Habit</Text>
          </TouchableOpacity>
        </Link>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="auto" />
        <View style={styles.container}>
          <ScrollView style={styles.habitList}>
            {habits.map((habit) => (
              <Swipeable
                key={habit.id}
                renderRightActions={() => renderRightActions(habit.id)}
              >
                <View style={[styles.habitItem, { backgroundColor: colors.card }]}>
                  <View style={styles.habitInfo}>
                    {showEmojis && <Text style={styles.emoji}>{habit.emoji}</Text>}
                    <View style={styles.habitDetails}>
                      <Text style={[styles.habitName, { color: colors.text }]}>{habit.name}</Text>
                      <Text style={[styles.streakText, { color: colors.secondary }]}>
                        {habit.streak} day streak 🔥
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.checkbox,
                      habit.completedToday && { backgroundColor: colors.primary }
                    ]}
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
  habitList: {
    flex: 1,
  },
  habitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  habitInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 24,
    marginRight: 12,
  },
  habitDetails: {
    flex: 1,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  streakText: {
    fontSize: 14,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
  },
}); 