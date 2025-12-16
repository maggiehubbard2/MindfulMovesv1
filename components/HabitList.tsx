import { useTheme } from '@/context/ThemeContext';
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
  description?: string;
  completed: boolean;
}

interface HabitListProps {
  habits: Habit[];
  onToggleHabit: (id: string) => void;
  onRemoveHabit: (id: string) => void;
}

export default function HabitList({ habits, onToggleHabit, onRemoveHabit }: HabitListProps) {
  const { colors } = useTheme();

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
        <Ionicons name="flag" size={64} color={colors.primary} />
        <Text style={[styles.emptyText, { color: colors.text }]}>
          No habits yet. Add your first habit!
        </Text>
        <View style={{ height: 20 }} />

        <Link href="/(tabs)/addhabit" asChild>
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
                    <View style={styles.habitDetails}>
                      <Text style={[styles.habitName, { color: colors.text }]}>{habit.name}</Text>
                      {habit.description && (
                        <Text style={[styles.descriptionText, { color: colors.secondary }]}>
                          {habit.description}
                        </Text>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.checkbox,
                      habit.completed && { backgroundColor: colors.primary }
                    ]}
                    onPress={() => onToggleHabit(habit.id)}
                  >
                    {habit.completed && (
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
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
  habitDetails: {
    flex: 1,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 14,
    marginBottom: 2,
  },
  dateText: {
    fontSize: 12,
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

