import { useHabits } from '@/context/HabitsContext';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface DailyHabitListProps {
  onHabitToggle?: (id: string) => void;
  maxItems?: number;
}

export default function DailyHabitList({ onHabitToggle, maxItems }: DailyHabitListProps) {
  const { selectedDate, getHabitsForDate, toggleHabit, canEditDate } = useHabits();
  const { colors } = useTheme();
  
  const habits = getHabitsForDate(selectedDate);
  const isEditable = canEditDate(selectedDate);

  // Sort habits: unchecked first (for dashboard view only)
  // This keeps the user's custom order but prioritizes incomplete habits
  const sortedHabits = [...habits].sort((a, b) => {
    if (a.completed === b.completed) {
      // If both have same completion status, maintain original order
      return 0;
    }
    // Unchecked items come first
    return a.completed ? 1 : -1;
  });

  const displayedHabits = sortedHabits;
  const hasMore = false; // Always show all habits, no "see all" needed

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
    if (!isEditable) return;
    toggleHabit(id, selectedDate);
    onHabitToggle?.(id);
  };

  // Calculate streak for a habit based on consecutive completion days
  const calculateStreak = (completionDates: string[]): number => {
    if (!completionDates || completionDates.length === 0) return 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    
    // Check if today is completed
    const hasToday = completionDates.includes(todayStr);
    
    // Start counting from today if completed, otherwise from yesterday
    let currentDate = new Date(today);
    if (!hasToday) {
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    let streak = 0;
    
    // Count consecutive days going backwards
    // Limit to 365 days to prevent infinite loops
    for (let i = 0; i < 365; i++) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const isCompleted = completionDates.includes(dateStr);
      
      if (isCompleted) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        // Stop at first gap
        break;
      }
    }
    
    return streak;
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

const weekday =
  selectedDate
    ? selectedDate.toLocaleDateString('en-US', { weekday: 'long' })
    : 'Daily';


  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{weekday} Habits</Text>
        {hasMore && (
          <TouchableOpacity onPress={() => router.push('/(tabs)/habits')}>
            <Text style={[styles.seeAllText, { color: colors.primary }]}>See all</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Habit List */}
      <View style={styles.list}>
        {displayedHabits.map((habit, index) => {
          const isCompleted = habit.completed;
          const icon = getHabitIcon(habit.name, index);
          const isLast = index === displayedHabits.length - 1;

          const streak = calculateStreak(habit.completionDates || []);

          return (
            <AnimatedHabitRow
              key={habit.id}
              habit={habit}
              index={index}
              isLast={isLast}
              icon={icon}
              colors={colors}
              isEditable={isEditable}
              streak={streak}
              onToggle={() => handleToggle(habit.id)}
            />
          );
        })}
      </View>
    </View>
  );
}

interface AnimatedHabitRowProps {
  habit: any;
  index: number;
  isLast: boolean;
  icon: { name: string; color: string };
  colors: any;
  isEditable: boolean;
  streak: number;
  onToggle: () => void;
}

function AnimatedHabitRow({ habit, index, isLast, icon, colors, isEditable, streak, onToggle }: AnimatedHabitRowProps) {
  const isCompleted = habit.completed;
  const indicatorScale = useSharedValue(1);
  const checkmarkScale = useSharedValue(0);
  const cardScale = useSharedValue(1);
  const [wasCompleted, setWasCompleted] = useState(isCompleted);

  useEffect(() => {
    if (isCompleted && !wasCompleted) {
      // Bounce animation when completed
      indicatorScale.value = withSequence(
        withSpring(1.3, { damping: 6, stiffness: 200 }),
        withSpring(1, { damping: 8, stiffness: 200 })
      );
      checkmarkScale.value = withSequence(
        withTiming(0, { duration: 0 }),
        withSpring(1, { damping: 8, stiffness: 200 })
      );
      cardScale.value = withSequence(
        withSpring(1.02, { damping: 10, stiffness: 150 }),
        withSpring(1, { damping: 10, stiffness: 150 })
      );
    } else if (!isCompleted) {
      checkmarkScale.value = withTiming(0, { duration: 150 });
      indicatorScale.value = withTiming(1, { duration: 150 });
      cardScale.value = withTiming(1, { duration: 150 });
    }
    setWasCompleted(isCompleted);
  }, [isCompleted]);

  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ scale: indicatorScale.value }],
  }));

  const animatedCheckmarkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkmarkScale.value }],
  }));

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  return (
    <View style={styles.habitRow}>
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
        <TouchableOpacity
          onPress={onToggle}
          disabled={!isEditable}
          activeOpacity={0.7}
        >
          <Animated.View
            style={[
              styles.completionIndicator,
              { 
                backgroundColor: isCompleted ? colors.primary : 'transparent',
                borderColor: isCompleted ? colors.primary : colors.border
              },
              animatedIndicatorStyle,
            ]}
          >
            {isCompleted && (
              <Animated.View style={animatedCheckmarkStyle}>
                <Ionicons name="checkmark" size={12} color="white" />
              </Animated.View>
            )}
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Habit Card */}
      <Animated.View style={[styles.habitCardWrapper, animatedCardStyle]}>
        <TouchableOpacity
          style={[
            styles.habitCard,
            { backgroundColor: colors.card },
            !isEditable && { opacity: 0.7 }
          ]}
          onPress={onToggle}
          activeOpacity={0.7}
          disabled={!isEditable}
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
            <View style={styles.habitNameRow}>
              <Text 
                style={[
                  styles.habitName,
                  { 
                    color: colors.text,
                    textDecorationLine: isCompleted ? 'line-through' : 'none',
                    opacity: isCompleted ? 0.6 : 1,
                  }
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {habit.name}
              </Text>
              {/* Streak Indicator */}
              {streak > 1 && (
                <View style={styles.streakIndicator} pointerEvents="none">
                  <Text style={styles.streakEmoji}>🔥</Text>
                  <Text style={[styles.streakText, { color: colors.secondary }]}>
                    {streak} {streak === 1 ? 'Day' : 'Days'}
                  </Text>
                </View>
              )}
            </View>
            {habit.description && (
              <Text style={[styles.habitDescription, { color: colors.secondary }]} numberOfLines={1}>
                {habit.description}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
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
  habitCardWrapper: {
    flex: 1,
    minWidth: 0, // Important for flex children to shrink properly
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
    minWidth: 0, // Important for flex children to shrink properly
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
    minWidth: 0, // Important for flex children to shrink properly
  },
  habitNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  streakIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    flexShrink: 0,
  },
  streakEmoji: {
    fontSize: 12,
    marginRight: 2,
  },
  streakText: {
    fontSize: 11,
    fontWeight: '500',
  },
  habitName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    minWidth: 0,
  },
  habitDescription: {
    fontSize: 12,
  },
});

