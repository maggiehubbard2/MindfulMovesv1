import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Keyboard, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import EmojiPicker from './EmojiPicker';
import { ThemedText } from './ThemedText';


interface AddHabitProps {
  onAddHabit: (name: string, emoji: string) => void;
}

export default function AddHabit({ onAddHabit }: AddHabitProps) {
  const { colors } = useTheme();
  const [habitName, setHabitName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🎯');
  const [isEmojiPickerVisible, setIsEmojiPickerVisible] = useState(false);

  const handleAddHabit = () => {
    if (habitName.trim()) {
      onAddHabit(habitName.trim(), selectedEmoji);
      setHabitName('');
      Keyboard.dismiss();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <SafeAreaView style={styles.safeArea}>  
      <StatusBar style="auto" />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <ThemedText style={styles.title}>Add New Habit</ThemedText>
        </View>
        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={[styles.emojiButton, { backgroundColor: colors.background }]}
            onPress={() => setIsEmojiPickerVisible(true)}
          >
            <ThemedText style={styles.emoji}>{selectedEmoji}</ThemedText>
          </TouchableOpacity>
          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.background,
              color: colors.text,
              borderColor: colors.border,
            }]}
            placeholder="Add a new habit..."
            placeholderTextColor={colors.text}
            value={habitName}
            onChangeText={setHabitName}
            onSubmitEditing={handleAddHabit}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={[styles.addButton, { 
              backgroundColor: habitName.trim() ? colors.primary : colors.border,
              opacity: habitName.trim() ? 1 : 0.5,
            }]}
            onPress={handleAddHabit}
            disabled={!habitName.trim()}
          >
            <ThemedText style={styles.addButtonText}>Add</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
      </SafeAreaView>
      <EmojiPicker
        visible={isEmojiPickerVisible}
        onClose={() => setIsEmojiPickerVisible(false)}
        onSelect={(emoji) => setSelectedEmoji(emoji)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
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
});