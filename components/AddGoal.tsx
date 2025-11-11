import { useTheme } from '@/context/ThemeContext';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Keyboard, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface AddGoalProps {
  onAddGoal: (data: { title: string; description?: string; why?: string }) => void;
}

export default function AddGoal({ onAddGoal }: AddGoalProps) {
  const { colors, isDarkMode } = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [why, setWhy] = useState('');

  const handleAddGoal = () => {
    if (!title.trim()) return;

    onAddGoal({
      title: title.trim(),
      description: description.trim() || undefined,
      why: why.trim() || undefined,
    });

    setTitle('');
    setDescription('');
    setWhy('');
    Keyboard.dismiss();
    router.push('/(tabs)/goals');
  };

  const isSubmitDisabled = !title.trim();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.cancelButton}
          accessibilityRole="button"
          accessibilityLabel="Cancel goal creation"
        >
          <Text style={[styles.cancelText, { color: colors.primary }]}>Cancel</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Goal title</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            placeholder="Start with a clear objective..."
            placeholderTextColor={colors.secondary}
            value={title}
            onChangeText={setTitle}
            returnKeyType="next"
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Description (optional)</Text>
          <TextInput
            style={[
              styles.multilineInput,
              { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
            ]}
            placeholder="What does success look like?"
            placeholderTextColor={colors.secondary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Why is this important?</Text>
          <Text style={[styles.helperText, { color: colors.secondary }]}>
            Jot down the motivation behind this goal. We’ll surface it when you build habits from it.
          </Text>
          <TextInput
            style={[
              styles.multilineInput,
              { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
            ]}
            placeholder="Because..."
            placeholderTextColor={colors.secondary}
            value={why}
            onChangeText={setWhy}
            multiline
            numberOfLines={4}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            {
              backgroundColor: isSubmitDisabled ? colors.border : colors.primary,
              opacity: isSubmitDisabled ? 0.6 : 1,
            },
          ]}
          onPress={handleAddGoal}
          disabled={isSubmitDisabled}
          activeOpacity={0.8}
        >
          <Text style={styles.submitButtonText}>Save Goal</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    padding: 20,
    gap: 20,
  },
  section: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 13,
    lineHeight: 18,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  multilineInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 96,
  },
  submitButton: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
  },
  topBar: {
    width: '100%',
    paddingHorizontal: 20,
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


