import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
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
  onUpdateHabit?: (id: string, name: string, description?: string) => void;
  onReorderHabits?: (fromIndex: number, toIndex: number) => void;
  isEditable?: boolean;
}

function HabitItem({
  habit,
  drag,
  isActive,
  colors,
  onToggleHabit,
  onRemoveHabit,
  onUpdateHabit,
  isEditable,
}: {
  habit: Habit;
  drag: () => void;
  isActive: boolean;
  colors: any;
  onToggleHabit: (id: string) => void;
  onRemoveHabit: (id: string) => void;
  onUpdateHabit?: (id: string, name: string, description?: string) => void;
  isEditable?: boolean;
}) {
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
    <Swipeable renderRightActions={renderRightActions} enabled={!isActive}>
      <ScaleDecorator>
        <TouchableOpacity
          onLongPress={isEditable ? drag : undefined}
          activeOpacity={0.7}
          style={[
            styles.habitItem,
            { backgroundColor: colors.card },
            isActive && styles.habitItemActive,
          ]}
        >
          {/* Hamburger icon - visual indicator only, drag works via row long-press */}
          {isEditable && (
            <View style={styles.dragHandle}>
              <Ionicons name="reorder-three-outline" size={24} color={colors.secondary} />
            </View>
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
        </TouchableOpacity>
      </ScaleDecorator>
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
  const [data, setData] = useState(habits);

  // Update local data when habits prop changes
  React.useEffect(() => {
    setData(habits);
  }, [habits]);

  // Handle drag end - update order and call parent callback
  const handleDragEnd = useCallback(
  ({ from, to, data }: { from: number; to: number; data: Habit[] }) => {
    setData(data);

    if (onReorderHabits && from !== to) {
      onReorderHabits(from, to);
    }
  },
  [onReorderHabits]
);


  const renderItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<Habit>) => {
      return (
        <HabitItem
          habit={item}
          drag={drag}
          isActive={isActive}
          colors={colors}
          onToggleHabit={onToggleHabit}
          onRemoveHabit={onRemoveHabit}
          onUpdateHabit={onUpdateHabit}
          isEditable={isEditable}
        />
      );
    },
    [colors, onToggleHabit, onRemoveHabit, onUpdateHabit, isEditable]
  );

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
          {isEditable && onReorderHabits ? (
            <DraggableFlatList
              data={data}
              onDragEnd={handleDragEnd}
              keyExtractor={(item: Habit) => item.id}
              renderItem={renderItem}
              contentContainerStyle={styles.habitList}
              // Allow default long-press behavior on the entire row
              animationConfig={{
                damping: 20,
                mass: 0.5,
                stiffness: 100,
              }}
            />
          ) : (
            <View style={styles.habitList}>
              {habits.map((habit: Habit) => (
                <HabitItem
                  key={habit.id}
                  habit={habit}
                  drag={() => {}}
                  isActive={false}
                  colors={colors}
                  onToggleHabit={onToggleHabit}
                  onRemoveHabit={onRemoveHabit}
                  onUpdateHabit={onUpdateHabit}
                  isEditable={isEditable}
                />
              ))}
            </View>
          )}
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
    paddingBottom: 16,
  },
  habitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  habitItemActive: {
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 8,
    opacity: 0.95,
  },
  dragHandle: {
    marginRight: 12,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
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
