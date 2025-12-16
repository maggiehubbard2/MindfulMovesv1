import { useHabits } from '@/context/HabitsContext';
import { useTheme } from '@/context/ThemeContext';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';

export default function EditHabitScreen() {
  const { colors, isDarkMode } = useTheme();
  const { updateHabit, habits } = useHabits();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [habitName, setHabitName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    const habit = habits.find(h => h.id === id);
    if (habit) {
      setHabitName(habit.name);
      setDescription(habit.description || '');
    }
  }, [id, habits]);

  const handleSaveHabit = () => {
    if (habitName.trim() && id) {
      updateHabit(id, habitName.trim(), description.trim() || undefined);
      Keyboard.dismiss();
      router.back();
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
          accessibilityLabel="Cancel editing habit"
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
            placeholderTextColor={colors.secondary}
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
          placeholderTextColor={colors.secondary}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />

        <TouchableOpacity
          style={[styles.saveButton, { 
            backgroundColor: habitName.trim() ? colors.primary : colors.border,
            opacity: habitName.trim() ? 1 : 0.5,
          }]}
          onPress={handleSaveHabit}
          disabled={!habitName.trim()}
        >
          <ThemedText style={styles.saveButtonText}>Save Changes</ThemedText>
        </TouchableOpacity>
      </View>
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
  saveButton: {
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
  saveButtonText: {
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

