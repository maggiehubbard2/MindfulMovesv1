import { useTheme } from '@/context/ThemeContext';
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
  const { colors, isDarkMode } = useTheme();
  const [habitName, setHabitName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🎯');
  const [isEmojiPickerVisible, setIsEmojiPickerVisible] = useState(false);

  const handleAddHabit = () => {
    if (habitName.trim()) {
      onAddHabit(habitName.trim(), selectedEmoji);
      setHabitName('');
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