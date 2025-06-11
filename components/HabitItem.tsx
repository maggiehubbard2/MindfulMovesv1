import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface HabitItemProps {
  name: string;
  emoji: string;
  isCompleted: boolean;
  onToggle: () => void;
}

export function HabitItem({ name, emoji, isCompleted, onToggle }: HabitItemProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.card }]}
      onPress={onToggle}
    >
      <View style={styles.content}>
        <Text style={styles.emoji}>{emoji}</Text>
        <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
      </View>
      <View
        style={[
          styles.checkCircle,
          {
            borderColor: colors.primary,
            backgroundColor: isCompleted ? colors.primary : 'transparent',
          },
        ]}
      >
        {isCompleted ? (
          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
        ) : (
          <View style={[styles.checkmarkOutline, { borderColor: colors.primary }]} />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  emoji: {
    fontSize: 24,
    marginRight: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkOutline: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
}); 