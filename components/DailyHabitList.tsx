import { useGoals } from '@/context/GoalsContext';
import { useHabits } from '@/context/HabitsContext';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface DailyHabitListProps {
  onHabitToggle?: (id: string) => void;
  maxItems?: number;
}

export default function DailyHabitList({ onHabitToggle, maxItems }: DailyHabitListProps) {
  const { habits, toggleHabit } = useHabits();
  const { goals } = useGoals();
  const { colors } = useTheme();

  const displayedHabits = maxItems ? habits.slice(0, maxItems) : habits;
  const hasMore = maxItems && habits.length > maxItems;

  const iconColors = [
    '#FFA07A', // Light salmon
    '#98D8C8', // Light green
    '#C7CEEA', // Light purple
    '#D4A574', // Light brown
    '#F7DC6F', // Light yellow
    '#A8E6CF', // Mint green
  ];

  const getHabitIcon = (habitName: string, index: number) => {
    const name = habitName.toLowerCase();
    const iconColor = iconColors[index % iconColors.length];
    
    if (name.includes('water') || name.includes('drink')) {
      return { name: 'water-outline', color: iconColor };
    } else if (name.includes('meditate') || name.includes('meditation')) {
      return { name: 'flower-outline', color: iconColor };
    } else if (name.includes('exercise') || name.includes('stretch') || name.includes('workout')) {
      return { name: 'fitness-outline', color: iconColor };
    } else if (name.includes('walk') || name.includes('run')) {
      return { name: 'walk-outline', color: iconColor };
    } else if (name.includes('read') || name.includes('book')) {
      return { name: 'library-outline', color: iconColor };
    } else {
      return { name: 'checkmark-circle-outline', color: iconColor };
    }
  };

  const handleToggle = (id: string) => {
    toggleHabit(id);
    onHabitToggle?.(id);
  };

  if (habits.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="list-outline" size={48} color={colors.secondary} />
        <Text style={[styles.emptyText, { color: colors.secondary }]}>
          No habits yet. Start by adding your first habit!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Daily habits</Text>
        {hasMore && (
          <TouchableOpacity onPress={() => router.push('/(tabs)/habits')}>
            <Text style={[styles.seeAllText, { color: colors.primary }]}>See all</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Habit List */}
      <ScrollView 
        style={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {displayedHabits.map((habit, index) => {
          const isCompleted = habit.completed;
          const icon = getHabitIcon(habit.name, index);
          const isLast = index === displayedHabits.length - 1;
          const goal = habit.goalId ? goals.find((g) => g.id === habit.goalId) : undefined;

          return (
            <View key={habit.id} style={styles.habitRow}>
              {/* Completion Indicator Line */}
              <View style={styles.indicatorColumn}>
                {!isLast && (
                  <View style={[
                    styles.indicatorLine,
                    { 
                      backgroundColor: isCompleted ? colors.primary : colors.border,
                      opacity: isCompleted ? 1 : 0.3
                    }
                  ]} />
                )}
                <View style={[
                  styles.completionIndicator,
                  { 
                    backgroundColor: isCompleted ? colors.primary : 'transparent',
                    borderColor: isCompleted ? colors.primary : colors.border
                  }
                ]}>
                  {isCompleted && (
                    <Ionicons name="checkmark" size={12} color="white" />
                  )}
                </View>
              </View>

              {/* Habit Card */}
              <TouchableOpacity
                style={[
                  styles.habitCard,
                  { backgroundColor: colors.card }
                ]}
                onPress={() => handleToggle(habit.id)}
                activeOpacity={0.7}
              >
                {/* Icon */}
                <View style={[
                  styles.iconContainer,
                  { backgroundColor: icon.color + '20' }
                ]}>
                  <Ionicons name={icon.name as any} size={24} color={icon.color} />
                </View>

                {/* Habit Info */}
                <View style={styles.habitInfo}>
                  <Text style={[
                    styles.habitName,
                    { 
                      color: colors.text,
                      textDecorationLine: isCompleted ? 'line-through' : 'none',
                      opacity: isCompleted ? 0.6 : 1
                    }
                  ]}>
                    {habit.name}
                  </Text>
                  {habit.description && (
                    <Text style={[styles.habitDescription, { color: colors.secondary }]} numberOfLines={1}>
                      {habit.description}
                    </Text>
                  )}
                  {goal && (
                    <Text style={[styles.goalTag, { color: colors.primary }]} numberOfLines={1}>
                      Goal: {goal.title}
                    </Text>
                  )}
                </View>

                {/* Duration/Streak */}
                <View style={styles.habitMeta}>
                  <View style={styles.metaRow}>
                    <Ionicons name="time-outline" size={14} color={colors.secondary} />
                    <Text style={[styles.metaText, { color: colors.secondary }]}>5 min</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
  },
  list: {
    paddingHorizontal: 20,
  },
  habitRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  indicatorColumn: {
    width: 24,
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  indicatorLine: {
    width: 2,
    flex: 1,
    marginBottom: 4,
  },
  completionIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  habitInfo: {
    flex: 1,
    marginRight: 8,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  habitDescription: {
    fontSize: 12,
  },
  goalTag: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  habitMeta: {
    alignItems: 'flex-end',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
});

