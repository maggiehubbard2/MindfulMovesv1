import { useGoals } from '@/context/GoalsContext';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Keyboard, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/Swipeable';

interface Habit {
  id: string;
  name: string;
  description?: string;
  completed: boolean;
  goalId?: string;
}

interface HabitListProps {
  habits: Habit[];
  onToggleHabit: (id: string) => void;
  onRemoveHabit: (id: string) => void;
  onUpdateHabit: (id: string, name: string, description?: string, goalId?: string) => void;
}

export default function HabitList({ habits, onToggleHabit, onRemoveHabit, onUpdateHabit }: HabitListProps) {
  const { colors } = useTheme();
  const { goals } = useGoals();
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editGoalId, setEditGoalId] = useState<string | undefined>();
  const [isGoalSelectorVisible, setIsGoalSelectorVisible] = useState(false);

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setEditName(habit.name);
    setEditDescription(habit.description || '');
    setEditGoalId(habit.goalId);
  };

  const handleSaveEdit = () => {
    if (editingHabit && editName.trim()) {
      onUpdateHabit(editingHabit.id, editName.trim(), editDescription.trim() || undefined, editGoalId);
      setEditingHabit(null);
      setEditName('');
      setEditDescription('');
      setEditGoalId(undefined);
      Keyboard.dismiss();
    }
  };

  const selectedGoal = goals.find((goal) => goal.id === editGoalId);

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

        <Link href="/addhabit" asChild>
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
                      {habit.goalId && (
                        <Text style={[styles.goalBadge, { color: colors.primary }]}>
                          Linked goal: {goals.find((goal) => goal.id === habit.goalId)?.title ?? 'Unknown goal'}
                        </Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.habitActions}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => handleEditHabit(habit)}
                    >
                      <Ionicons name="pencil" size={20} color={colors.primary} />
                    </TouchableOpacity>
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
                </View>
              </Swipeable>
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
                  setEditGoalId(undefined);
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

              <View style={styles.inputSection}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Link to a goal (optional)</Text>
                <TouchableOpacity
                  style={[styles.goalSelector, { borderColor: colors.border, backgroundColor: colors.card }]}
                  onPress={() => setIsGoalSelectorVisible(true)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.goalSelectorText, { color: selectedGoal ? colors.text : colors.secondary }]}>
                    {selectedGoal ? selectedGoal.title : goals.length ? 'Select a goal' : 'No goals yet'}
                  </Text>
                </TouchableOpacity>
                {selectedGoal && (
                  <TouchableOpacity
                    onPress={() => setEditGoalId(undefined)}
                    style={styles.clearGoalButton}
                  >
                    <Text style={[styles.clearGoalText, { color: colors.primary }]}>Clear goal</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.border }]}
                onPress={() => {
                  setEditingHabit(null);
                  setEditName('');
                  setEditDescription('');
                  setEditGoalId(undefined);
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

        {/* Goal Selector Modal */}
        <Modal
          visible={isGoalSelectorVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setIsGoalSelectorVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Choose a goal</Text>
              <ScrollView style={styles.modalList}>
                {goals.length === 0 && (
                  <View style={styles.emptyGoalsContainer}>
                    <Text style={[styles.emptyGoalsText, { color: colors.secondary }]}>
                      You haven't created any goals yet.
                    </Text>
                  </View>
                )}
                {goals.map((goal) => {
                  const isActive = goal.id === editGoalId;
                  return (
                    <TouchableOpacity
                      key={goal.id}
                      style={[
                        styles.goalItem,
                        {
                          borderColor: isActive ? colors.primary : colors.border,
                          backgroundColor: isActive ? colors.primary + '15' : colors.card,
                        },
                      ]}
                      onPress={() => {
                        setEditGoalId(goal.id);
                        setIsGoalSelectorVisible(false);
                      }}
                    >
                      <Text style={[styles.goalTitle, { color: colors.text }]}>{goal.title}</Text>
                      {goal.why && (
                        <Text style={[styles.goalWhyText, { color: colors.secondary }]} numberOfLines={2}>
                          {goal.why}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={() => setIsGoalSelectorVisible(false)}
              >
                <Text style={styles.modalButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  goalBadge: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  goalSelector: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    marginTop: 8,
  },
  goalSelectorText: {
    fontSize: 16,
  },
  clearGoalButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  clearGoalText: {
    fontSize: 14,
    fontWeight: '600',
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
  modalList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  goalItem: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  goalWhyText: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyGoalsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyGoalsText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

