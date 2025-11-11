import { Goal } from '@/context/GoalsContext';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface GoalListProps {
  goals: Goal[];
  onRemoveGoal: (id: string) => void;
  onEditGoal: (goal: Goal) => void;
}

export default function GoalList({ goals, onRemoveGoal, onEditGoal }: GoalListProps) {
  const { colors } = useTheme();

  if (goals.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="star-outline" size={56} color={colors.primary} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>No goals yet</Text>
        <Text style={[styles.emptySubtitle, { color: colors.secondary }]}>
          Create a north star goal to anchor the habits you build.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={goals}
      keyExtractor={(goal) => goal.id}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => (
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderInfo}>
              <Text style={[styles.goalTitle, { color: colors.text }]} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={[styles.goalDate, { color: colors.secondary }]}>
                Created {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}
              </Text>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity onPress={() => onEditGoal(item)} style={styles.actionButton} accessibilityRole="button" accessibilityLabel={`Edit goal ${item.title}`}>
                <Ionicons name="pencil-outline" size={18} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onRemoveGoal(item.id)} style={styles.actionButton} accessibilityRole="button" accessibilityLabel={`Delete goal ${item.title}`}>
                <Ionicons name="trash-outline" size={20} color={colors.secondary} />
              </TouchableOpacity>
            </View>
          </View>
          {item.why && (
            <Text style={[styles.goalWhy, { color: colors.primary }]}>Why: {item.why}</Text>
          )}
          {item.description && (
            <Text style={[styles.goalDescription, { color: colors.secondary }]}>{item.description}</Text>
          )}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 120,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  cardHeaderInfo: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  goalDate: {
    fontSize: 12,
    marginTop: 4,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  goalWhy: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  goalDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  deleteButton: {
    padding: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
});


