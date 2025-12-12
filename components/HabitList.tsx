import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Keyboard, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

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
  onUpdateHabit: (id: string, name: string, description?: string) => void;
  onReorderHabits?: (fromIndex: number, toIndex: number) => void;
  isEditable?: boolean;
}

interface AnimatedHabitItemProps {
  habit: Habit;
  colors: any;
  isEditable: boolean;
  onToggleHabit: (id: string) => void;
  onEditHabit: (habit: Habit) => void;
  renderRightActions: (id: string) => React.ReactNode;
}

interface DraggableHabitItemProps extends AnimatedHabitItemProps {
  index: number;
  onReorder: (fromIndex: number, toIndex: number) => void;
  draggedIndex: number | null;
  setDraggedIndex: (index: number | null) => void;
}

function DraggableHabitItem({ 
  habit, 
  index,
  colors, 
  isEditable, 
  onToggleHabit, 
  onEditHabit, 
  onReorder,
  renderRightActions,
  draggedIndex,
  setDraggedIndex,
  totalHabits,
}: DraggableHabitItemProps & { totalHabits: number }) {
  const translateY = useSharedValue(0);
  const itemHeight = useSharedValue(0);
  const [itemLayout, setItemLayout] = useState({ y: 0, height: 0 });

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx: any) => {
      ctx.startY = translateY.value;
      runOnJS(setDraggedIndex)(index);
    },
    onActive: (event, ctx) => {
      translateY.value = ctx.startY + event.translationY;
    },
    onEnd: (event) => {
      // Calculate new index based on translation
      const itemHeight = itemLayout.height || 80; // fallback height
      const deltaIndex = Math.round(event.translationY / itemHeight);
      const newIndex = index + deltaIndex;
      const clampedIndex = Math.max(0, Math.min(totalHabits - 1, newIndex));
      
      if (clampedIndex !== index) {
        runOnJS(onReorder)(index, clampedIndex);
      }
      
      translateY.value = withSpring(0);
      runOnJS(setDraggedIndex)(null);
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    const isDragging = draggedIndex === index;
    return {
      transform: [{ translateY: translateY.value }],
      zIndex: isDragging ? 1000 : 1,
      opacity: isDragging ? 0.9 : 1,
    };
  });

  return (
    <Animated.View
      style={animatedStyle}
      onLayout={(event) => {
        const { y, height } = event.nativeEvent.layout;
        setItemLayout({ y, height });
        itemHeight.value = height;
      }}
    >
      <PanGestureHandler
        onGestureEvent={gestureHandler}
        enabled={isEditable}
        activeOffsetY={[-10, 10]}
      >
        <Animated.View>
          <AnimatedHabitItem
            habit={habit}
            colors={colors}
            isEditable={isEditable}
            onToggleHabit={onToggleHabit}
            onEditHabit={onEditHabit}
            renderRightActions={renderRightActions}
          />
        </Animated.View>
      </PanGestureHandler>
    </Animated.View>
  );
}

function AnimatedHabitItem({ habit, colors, isEditable, onToggleHabit, onEditHabit, renderRightActions }: AnimatedHabitItemProps) {
  const scale = useSharedValue(1);
  const checkmarkScale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const [wasCompleted, setWasCompleted] = useState(habit.completed);

  useEffect(() => {
    if (habit.completed && !wasCompleted) {
      // Animate when just completed
      scale.value = withSequence(
        withSpring(1.2, { damping: 8, stiffness: 200 }),
        withSpring(1, { damping: 8, stiffness: 200 })
      );
      checkmarkScale.value = withSequence(
        withTiming(0, { duration: 0 }),
        withSpring(1, { damping: 8, stiffness: 200 })
      );
      opacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0, { duration: 300, delay: 200 })
      );
    } else if (!habit.completed) {
      // Reset when unchecked
      checkmarkScale.value = withTiming(0, { duration: 150 });
    }
    setWasCompleted(habit.completed);
  }, [habit.completed]);

  const animatedCheckboxStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedCheckmarkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkmarkScale.value }],
  }));

  const animatedRippleStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value * 1.5 }],
  }));

  return (
    <Swipeable
      renderRightActions={() => renderRightActions(habit.id)}
    >
      <View style={[styles.habitItem, { backgroundColor: colors.card }]}>
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
        <View style={styles.habitActions}>
          {isEditable && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => onEditHabit(habit)}
            >
              <Ionicons name="pencil" size={20} color={colors.primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.checkbox,
              habit.completed && { backgroundColor: colors.primary },
              !isEditable && { opacity: 0.5 }
            ]}
            onPress={() => isEditable && onToggleHabit(habit.id)}
            disabled={!isEditable}
          >
            <Animated.View style={[styles.checkboxInner, animatedCheckboxStyle]}>
              {habit.completed && (
                <>
                  <Animated.View
                    style={[
                      styles.ripple,
                      { backgroundColor: colors.primary },
                      animatedRippleStyle,
                    ]}
                  />
                  <Animated.View style={animatedCheckmarkStyle}>
                    <Ionicons name="checkmark" size={20} color="white" />
                  </Animated.View>
                </>
              )}
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>
    </Swipeable>
  );
}

export default function HabitList({ habits, onToggleHabit, onRemoveHabit, onUpdateHabit, onReorderHabits, isEditable = true }: HabitListProps) {
  const { colors } = useTheme();
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setEditName(habit.name);
    setEditDescription(habit.description || '');
  };

  const handleSaveEdit = () => {
    if (editingHabit && editName.trim()) {
      onUpdateHabit(editingHabit.id, editName.trim(), editDescription.trim() || undefined);
      setEditingHabit(null);
      setEditName('');
      setEditDescription('');
      Keyboard.dismiss();
    }
  };

  const renderRightActions = (id: string) => {
    if (!isEditable) return null;
    
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

        <Link href="/addhabit" asChild>
          <TouchableOpacity style={styles.addFirstButton}>
            <Ionicons name="add" size={24} color="white" />
            <Text style={styles.addFirstButtonText}>Add Your First Habit</Text>
          </TouchableOpacity>
        </Link>
      </View>
    );
  }

  const handleReorder = (fromIndex: number, toIndex: number) => {
    if (onReorderHabits && fromIndex !== toIndex) {
      onReorderHabits(fromIndex, toIndex);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="auto" />
        <View style={styles.container}>
          <ScrollView style={styles.habitList}>
            {habits.map((habit, index) => (
              <DraggableHabitItem
                key={habit.id}
                habit={habit}
                index={index}
                colors={colors}
                isEditable={isEditable}
                onToggleHabit={onToggleHabit}
                onEditHabit={handleEditHabit}
                onReorder={handleReorder}
                renderRightActions={renderRightActions}
                draggedIndex={draggedIndex}
                setDraggedIndex={setDraggedIndex}
                totalHabits={habits.length}
              />
            ))}
          </ScrollView>
        </View>
      </SafeAreaView>

      {/* Edit Habit Modal */}
      <Modal
        visible={editingHabit !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingHabit(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Habit</Text>
              <TouchableOpacity
                onPress={() => {
                  setEditingHabit(null);
                  setEditName('');
                  setEditDescription('');
                }}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.inputSection}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Habit name</Text>
                <TextInput
                  style={[styles.modalInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                  placeholder="Habit name..."
                  placeholderTextColor={colors.secondary}
                  value={editName}
                  onChangeText={setEditName}
                />
              </View>

              <View style={styles.inputSection}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Description (optional)</Text>
                <TextInput
                  style={[styles.modalTextArea, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                  placeholder="Description..."
                  placeholderTextColor={colors.secondary}
                  value={editDescription}
                  onChangeText={setEditDescription}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.border }]}
                onPress={() => {
                  setEditingHabit(null);
                  setEditName('');
                  setEditDescription('');
                }}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: editName.trim() ? colors.primary : colors.border, opacity: editName.trim() ? 1 : 0.5 }]}
                onPress={handleSaveEdit}
                disabled={!editName.trim()}
              >
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    overflow: 'visible',
  },
  checkboxInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ripple: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    opacity: 0.3,
  },
  deleteAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
  },
  habitActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  editButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 420,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  modalScroll: {
    maxHeight: 400,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  modalTextArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

