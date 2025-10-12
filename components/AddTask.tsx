import { useHabits } from '@/context/HabitsContext';
import { TaskFrequency } from '@/context/TasksContext';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Keyboard, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import EmojiPicker from './EmojiPicker';
import { ThemedText } from './ThemedText';

interface AddTaskProps {
  onAddTask: (name: string, emoji: string, frequency: TaskFrequency, habitId?: string) => void;
}

export default function AddTask({ onAddTask }: AddTaskProps) {
  const { colors, isDarkMode } = useTheme();
  const { habits } = useHabits();
  const [taskName, setTaskName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🎯');
  const [selectedFrequency, setSelectedFrequency] = useState<TaskFrequency>('one-time');
  const [selectedHabitId, setSelectedHabitId] = useState<string | undefined>(undefined);
  const [showHabitPicker, setShowHabitPicker] = useState(false);
  const [showFrequencyPicker, setShowFrequencyPicker] = useState(false);
  const [isEmojiPickerVisible, setIsEmojiPickerVisible] = useState(false);

  const selectedHabit = habits.find(h => h.id === selectedHabitId);

  const handleAddTask = () => {
    if (taskName.trim()) {
      onAddTask(taskName.trim(), selectedEmoji, selectedFrequency, selectedHabitId);
      setTaskName('');
      setSelectedFrequency('one-time');
      setSelectedHabitId(undefined);
      Keyboard.dismiss();
      router.back();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <View style={styles.content}>
        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={[styles.emojiButton, { backgroundColor: colors.card }]}
            onPress={() => setIsEmojiPickerVisible(true)}
          >
            <ThemedText style={styles.emoji}>{selectedEmoji}</ThemedText>
          </TouchableOpacity>
          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.card,
              color: colors.text,
              borderColor: colors.border,
            }]}
            placeholder="Add a new task..."
            placeholderTextColor={colors.text}
            value={taskName}
            onChangeText={setTaskName}
            onSubmitEditing={handleAddTask}
            returnKeyType="done"
          />
        </View>

        {/* Frequency Picker */}
        <TouchableOpacity
          style={[styles.habitSelector, { 
            backgroundColor: colors.card,
            borderColor: colors.border,
          }]}
          onPress={() => setShowFrequencyPicker(true)}
        >
          <Ionicons name="time-outline" size={20} color={colors.secondary} />
          <ThemedText style={[styles.habitSelectorText, { color: colors.text }]}>
            {selectedFrequency === 'one-time' ? 'One Time' : 
             selectedFrequency === 'daily' ? 'Daily' : 'Weekly'}
          </ThemedText>
        </TouchableOpacity>

        {/* Related Habit Dropdown */}
        <TouchableOpacity
          style={[styles.habitSelector, { 
            backgroundColor: colors.card,
            borderColor: colors.border,
          }]}
          onPress={() => setShowHabitPicker(true)}
        >
          <Ionicons name="repeat-outline" size={20} color={colors.secondary} />
          <ThemedText style={[styles.habitSelectorText, { color: selectedHabit ? colors.text : colors.secondary }]}>
            {selectedHabit ? `${selectedHabit.emoji} ${selectedHabit.name}` : 'Link to a habit (optional)'}
          </ThemedText>
          {selectedHabit ? (
            <TouchableOpacity
              style={styles.clearHabitButton}
              onPress={(e) => {
                e.stopPropagation();
                setSelectedHabitId(undefined);
              }}
            >
              <Ionicons name="close-circle" size={20} color={colors.secondary} />
            </TouchableOpacity>
          ) : (
            <Ionicons name="chevron-down" size={20} color={colors.secondary} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.addButton, { 
            backgroundColor: taskName.trim() ? colors.primary : colors.border,
            opacity: taskName.trim() ? 1 : 0.5,
          }]}
          onPress={handleAddTask}
          disabled={!taskName.trim()}
        >
          <ThemedText style={styles.addButtonText}>Add Task</ThemedText>
        </TouchableOpacity>
      </View>
      <EmojiPicker
        visible={isEmojiPickerVisible}
        onClose={() => setIsEmojiPickerVisible(false)}
        onSelect={(emoji) => setSelectedEmoji(emoji)}
      />

      {/* Habit Picker Modal */}
      <Modal
        visible={showHabitPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowHabitPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={[styles.modalTitle, { color: colors.text }]}>Select a Habit</ThemedText>
              <TouchableOpacity onPress={() => setShowHabitPicker(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.habitsList}>
              {habits.length === 0 ? (
                <View style={styles.emptyHabits}>
                  <Ionicons name="repeat-outline" size={48} color={colors.secondary} />
                  <Text style={[styles.emptyHabitsText, { color: colors.secondary }]}>
                    No habits yet. Create a habit first!
                  </Text>
                </View>
              ) : (
                habits.map((habit) => (
                  <TouchableOpacity
                    key={habit.id}
                    style={[
                      styles.habitOption,
                      { borderBottomColor: colors.border },
                      selectedHabitId === habit.id && { backgroundColor: colors.primary + '20' }
                    ]}
                    onPress={() => {
                      setSelectedHabitId(habit.id);
                      setShowHabitPicker(false);
                    }}
                  >
                    <Text style={styles.habitEmoji}>{habit.emoji}</Text>
                    <View style={styles.habitOptionText}>
                      <Text style={[styles.habitOptionName, { color: colors.text }]}>{habit.name}</Text>
                      {habit.description && (
                        <Text style={[styles.habitOptionDesc, { color: colors.secondary }]} numberOfLines={1}>
                          {habit.description}
                        </Text>
                      )}
                    </View>
                    {selectedHabitId === habit.id && (
                      <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Frequency Picker Modal */}
      <Modal
        visible={showFrequencyPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFrequencyPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={[styles.modalTitle, { color: colors.text }]}>Select Frequency</ThemedText>
              <TouchableOpacity onPress={() => setShowFrequencyPicker(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.habitsList}>
              {[
                { value: 'one-time', label: 'One Time', icon: 'checkmark-circle-outline' },
                { value: 'daily', label: 'Daily', icon: 'calendar-outline' },
                { value: 'monthly', label: 'Monthly', icon: 'calendar-outline' }
              ].map((frequency) => (
                <TouchableOpacity
                  key={frequency.value}
                  style={[
                    styles.habitOption,
                    { borderBottomColor: colors.border },
                    selectedFrequency === frequency.value && { backgroundColor: colors.primary + '20' }
                  ]}
                  onPress={() => {
                    setSelectedFrequency(frequency.value as TaskFrequency);
                    setShowFrequencyPicker(false);
                  }}
                >
                  <Ionicons name={frequency.icon as any} size={24} color={colors.secondary} />
                  <View style={styles.habitOptionText}>
                    <Text style={[styles.habitOptionName, { color: colors.text }]}>{frequency.label}</Text>
                  </View>
                  {selectedFrequency === frequency.value && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
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
  habitSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  habitSelectorText: {
    flex: 1,
    fontSize: 16,
  },
  clearHabitButton: {
    padding: 4,
  },
  emojiButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
  emoji: {
    fontSize: 22,
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
  addButton: {
    height: 44,
    paddingHorizontal: 20,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  habitsList: {
    maxHeight: 400,
  },
  emptyHabits: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyHabitsText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  habitOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  habitEmoji: {
    fontSize: 24,
  },
  habitOptionText: {
    flex: 1,
  },
  habitOptionName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  habitOptionDesc: {
    fontSize: 14,
  },
});