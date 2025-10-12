import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Keyboard, Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import EmojiPicker from './EmojiPicker';
import { ThemedText } from './ThemedText';

interface AddHabitProps {
  onAddHabit: (name: string, emoji: string, description?: string, targetDate?: string) => void;
}

export default function AddHabit({ onAddHabit }: AddHabitProps) {
  const { colors, isDarkMode } = useTheme();
  const [habitName, setHabitName] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState<Date | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState('🎯');
  const [isEmojiPickerVisible, setIsEmojiPickerVisible] = useState(false);

  const handleAddHabit = () => {
    if (habitName.trim()) {
      const dateString = targetDate ? targetDate.toISOString().split('T')[0] : undefined;
      onAddHabit(habitName.trim(), selectedEmoji, description.trim() || undefined, dateString);
      setHabitName('');
      setDescription('');
      setTargetDate(undefined);
      Keyboard.dismiss();
      router.back();
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setTargetDate(selectedDate);
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

        <TouchableOpacity
          style={[styles.datePickerButton, { 
            backgroundColor: colors.card,
            borderColor: colors.border,
          }]}
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar-outline" size={20} color={colors.secondary} />
          <ThemedText style={[styles.datePickerText, { color: targetDate ? colors.text : colors.secondary }]}>
            {targetDate ? targetDate.toLocaleDateString() : 'Target Date (optional)'}
          </ThemedText>
          {targetDate && (
            <TouchableOpacity
              style={styles.clearDateButton}
              onPress={() => setTargetDate(undefined)}
            >
              <Ionicons name="close-circle" size={20} color={colors.secondary} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={targetDate || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
            minimumDate={new Date()}
          />
        )}
        
        {Platform.OS === 'ios' && showDatePicker && (
          <TouchableOpacity
            style={[styles.doneButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowDatePicker(false)}
          >
            <ThemedText style={styles.doneButtonText}>Done</ThemedText>
          </TouchableOpacity>
        )}

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
      <EmojiPicker
        visible={isEmojiPickerVisible}
        onClose={() => setIsEmojiPickerVisible(false)}
        onSelect={(emoji) => setSelectedEmoji(emoji)}
      />
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
  datePickerButton: {
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
  datePickerText: {
    flex: 1,
    fontSize: 16,
  },
  clearDateButton: {
    padding: 4,
  },
  doneButton: {
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  doneButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
});

