import { useGoals } from '@/context/GoalsContext';
import { useTheme } from '@/context/ThemeContext';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Keyboard, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from './ThemedText';

interface AddHabitProps {
  onAddHabit: (name: string, description?: string, goalId?: string) => void;
}

export default function AddHabit({ onAddHabit }: AddHabitProps) {
  const { colors, isDarkMode } = useTheme();
  const { goals } = useGoals();
  const [habitName, setHabitName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedGoalId, setSelectedGoalId] = useState<string | undefined>();
  const [isGoalSelectorVisible, setIsGoalSelectorVisible] = useState(false);

  const selectedGoal = goals.find((goal) => goal.id === selectedGoalId);

  const handleAddHabit = () => {
    if (habitName.trim()) {
      onAddHabit(habitName.trim(), description.trim() || undefined, selectedGoalId);
      setHabitName('');
      setDescription('');
      setSelectedGoalId(undefined);
      Keyboard.dismiss();
      router.replace('/(tabs)/habits');
    }
  };


  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.cancelButton}
          accessibilityRole="button"
          accessibilityLabel="Cancel adding habit"
        >
          <Text style={[styles.cancelText, { color: colors.primary }]}>Cancel</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.card,
              color: colors.text,
              borderColor: colors.border,
            }]}
            placeholder="Habit name..."
            placeholderTextColor={colors.text}
            value={habitName}
            onChangeText={setHabitName}
            returnKeyType="next"
          />
        </View>

        <TextInput
          style={[styles.textArea, { 
            backgroundColor: colors.card,
            color: colors.text,
            borderColor: colors.border,
          }]}
          placeholder="Description (optional)..."
          placeholderTextColor={colors.text}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />

        <View style={styles.goalSelectorContainer}>
          <Text style={[styles.sectionLabel, { color: colors.secondary }]}>Link to a goal (optional)</Text>
          <TouchableOpacity
            style={[
              styles.goalSelector,
              { 
                borderColor: colors.border,
                backgroundColor: colors.card,
              },
            ]}
            onPress={() => setIsGoalSelectorVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.goalSelectorText, { color: selectedGoal ? colors.text : colors.secondary }]}>
              {selectedGoal ? selectedGoal.title : goals.length ? 'Select a goal' : 'No goals yet'}
            </Text>
          </TouchableOpacity>
          {selectedGoal && (
            <TouchableOpacity
              onPress={() => setSelectedGoalId(undefined)}
              style={styles.clearGoalButton}
            >
              <Text style={[styles.clearGoalText, { color: colors.primary }]}>Clear goal</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.addButton, { 
            backgroundColor: habitName.trim() ? colors.primary : colors.border,
            opacity: habitName.trim() ? 1 : 0.5,
          }]}
          onPress={handleAddHabit}
          disabled={!habitName.trim()}
        >
          <ThemedText style={styles.addButtonText}>Add Habit</ThemedText>
        </TouchableOpacity>
      </View>

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
                  <TouchableOpacity
                    style={[styles.createGoalButton, { borderColor: colors.primary }]}
                    onPress={() => {
                      setIsGoalSelectorVisible(false);
                      router.push('/(tabs)/addgoal');
                    }}
                  >
                    <Text style={[styles.createGoalText, { color: colors.primary }]}>Create a goal</Text>
                  </TouchableOpacity>
                </View>
              )}
              {goals.map((goal) => {
                const isActive = goal.id === selectedGoalId;
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
                      setSelectedGoalId(goal.id);
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
              style={[styles.modalCloseButton, { backgroundColor: colors.primary }]}
              onPress={() => setIsGoalSelectorVisible(false)}
            >
              <Text style={styles.modalCloseText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  input: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  textArea: {
    height: 80,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  addButton: {
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  goalSelectorContainer: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  goalSelector: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  goalSelectorText: {
    fontSize: 16,
  },
  clearGoalButton: {
    alignSelf: 'flex-start',
  },
  clearGoalText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  modalList: {
    maxHeight: 300,
  },
  goalItem: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  goalWhyText: {
    fontSize: 14,
  },
  emptyGoalsText: {
    fontSize: 14,
    marginBottom: 16,
  },
  emptyGoalsContainer: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  createGoalButton: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  createGoalText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalCloseButton: {
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCloseText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  topBar: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'flex-end',
  },
  cancelButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

