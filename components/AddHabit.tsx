import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const COMMON_EMOJIS = ['🏃', '💧', '📚', '🧘', '🎯', '🎨', '🎵', '🌱', '💪', '🧠', '😴', '🥗'];

interface AddHabitProps {
  onAddHabit: (name: string, emoji: string) => void;
}

export default function AddHabit({ onAddHabit }: AddHabitProps) {
  const [newHabitName, setNewHabitName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(COMMON_EMOJIS[0]);
  const [errorMessage, setErrorMessage] = useState('');

  const handleAddHabit = () => {
    if (newHabitName.trim()) {
      onAddHabit(newHabitName.trim(), selectedEmoji);
      setNewHabitName('');
      router.back();
    } else {
      setErrorMessage('Please enter a habit name');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="auto" />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Add New Habit</Text>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, errorMessage ? styles.inputError : null]}
            value={newHabitName}
            onChangeText={(text) => {
              setNewHabitName(text);
              if (errorMessage) setErrorMessage('');
            }}
            placeholder="Enter habit name..."
            placeholderTextColor="#666"
            autoFocus
          />
          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}
        </View>

        <View style={styles.emojiSection}>
          <Text style={styles.emojiTitle}>Choose an emoji:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiList}>
            {COMMON_EMOJIS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={[
                  styles.emojiButton,
                  selectedEmoji === emoji && styles.selectedEmojiButton,
                ]}
                onPress={() => setSelectedEmoji(emoji)}
              >
                <Text style={styles.emoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={handleAddHabit}>
          <Ionicons name="add" size={24} color="white" />
          <Text style={styles.addButtonText}>Add Habit</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    padding: 16,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  inputContainer: {
    marginBottom: 24,
  },
  input: {
    height: 48,
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#ff4444',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    marginTop: 8,
    marginLeft: 4,
  },
  emojiSection: {
    marginBottom: 24,
  },
  emojiTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  emojiList: {
    flexDirection: 'row',
  },
  emojiButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectedEmojiButton: {
    backgroundColor: '#007AFF',
  },
  emoji: {
    fontSize: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 