import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';

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
  onUpdateHabit?: (id: string, name: string, description?: string) => void;
  onReorderHabits?: (fromIndex: number, toIndex: number) => void;
  isEditable?: boolean;
}

const DRAG_THRESHOLD = 50;

function DraggableHabitItem({
  habit,
  index,
  totalItems,
  colors,
  onToggleHabit,
  onRemoveHabit,
  onUpdateHabit,
  onReorderHabits,
  isEditable,
}: {
  habit: Habit;
  index: number;
  totalItems: number;
  colors: any;
  onToggleHabit: (id: string) => void;
  onRemoveHabit: (id: string) => void;
  onUpdateHabit?: (id: string, name: string, description?: string) => void;
  onReorderHabits?: (fromIndex: number, toIndex: number) => void;
  isEditable?: boolean;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      opacity.value = 0.8;
      runOnJS(setIsDragging)(true);
    },
    onActive: (event) => {
      translateY.value = event.translationY;
    },
    onEnd: (event) => {
      const threshold = 30;
      let newIndex = index;
      
      if (event.translationY > threshold && index < totalItems - 1) {
        newIndex = index + 1;
      } else if (event.translationY < -threshold && index > 0) {
        newIndex = index - 1;
      }
      
      if (newIndex !== index && onReorderHabits) {
        runOnJS(onReorderHabits)(index, newIndex);
      }
      
      translateY.value = withSpring(0);
      opacity.value = withSpring(1);
      runOnJS(setIsDragging)(false);
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
      opacity: opacity.value,
      zIndex: isDragging ? 1000 : 1,
    };
  });

  const renderRightActions = () => {
    return (
      <TouchableOpacity
        style={[styles.deleteAction, { backgroundColor: '#FF3B30' }]}
        onPress={() => onRemoveHabit(habit.id)}
      >
        <Ionicons name="trash" size={24} color="white" />
      </TouchableOpacity>
    );
  };

  const handleEdit = () => {
    if (onUpdateHabit) {
      router.push(`/edithabit?id=${habit.id}`);
    }
  };

  return (
    <Swipeable renderRightActions={renderRightActions}>
      <Animated.View style={animatedStyle}>
        <View style={[styles.habitItem, { backgroundColor: colors.card }]}>
          {/* Drag Handle */}
          {isEditable && onReorderHabits && (
            <PanGestureHandler
              onGestureEvent={gestureHandler}
              activeOffsetY={[-10, 10]}
            >
              <Animated.View>
                <TouchableOpacity
                  style={styles.dragHandle}
                  activeOpacity={0.7}
                >
                  <Ionicons name="reorder-three-outline" size={24} color={colors.secondary} />
                </TouchableOpacity>
              </Animated.View>
            </PanGestureHandler>
          )}

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

          {/* Edit Button */}
          {isEditable && onUpdateHabit && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleEdit}
              activeOpacity={0.7}
            >
              <Ionicons name="pencil-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
          )}

          {/* Checkbox */}
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
      </Animated.View>
    </Swipeable>
  );
}

export default function HabitList({ 
  habits, 
  onToggleHabit, 
  onRemoveHabit,
  onUpdateHabit,
  onReorderHabits,
  isEditable = true,
}: HabitListProps) {
  const { colors } = useTheme();

  if (habits.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="flag" size={64} color={colors.primary} />
        <Text style={[styles.emptyText, { color: colors.text }]}>
          No habits yet. Add your first habit!
        </Text>
        <View style={{ height: 20 }} />

        <Link href="/addhabit" asChild>
          <TouchableOpacity style={[styles.addFirstButton, { backgroundColor: colors.primary }]}>
            <Ionicons name="add" size={24} color="white" />
            <Text style={styles.addFirstButtonText}>Add Your First Habit</Text>
          </TouchableOpacity>
        </Link>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <StatusBar style="auto" />
        <View style={styles.container}>
          <ScrollView style={styles.habitList}>
            {habits.map((habit, index) => (
              <DraggableHabitItem
                key={habit.id}
                habit={habit}
                index={index}
                totalItems={habits.length}
                colors={colors}
                onToggleHabit={onToggleHabit}
                onRemoveHabit={onRemoveHabit}
                onUpdateHabit={onUpdateHabit}
                onReorderHabits={onReorderHabits}
                isEditable={isEditable}
              />
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
    marginBottom: 8,
    borderRadius: 12,
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dragHandle: {
    marginRight: 12,
    padding: 4,
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
  editButton: {
    marginRight: 12,
    padding: 8,
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
    borderRadius: 12,
    marginBottom: 8,
  },
});
