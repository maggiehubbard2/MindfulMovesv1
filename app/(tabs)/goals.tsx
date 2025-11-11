import GoalList from '@/components/GoalList';
import { useAuth } from '@/context/AuthContext';
import { Goal, useGoals } from '@/context/GoalsContext';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useMemo, useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GoalsScreen() {
  const { colors, isDarkMode } = useTheme();
  const { userProfile } = useAuth();
  const { goals, removeGoal, updateGoal } = useGoals();
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editWhy, setEditWhy] = useState('');

  const isSaveDisabled = useMemo(() => !editTitle.trim(), [editTitle]);

  const openEditModal = (goal: Goal) => {
    setEditingGoal(goal);
    setEditTitle(goal.title);
    setEditDescription(goal.description ?? '');
    setEditWhy(goal.why ?? '');
  };

  const closeEditModal = () => {
    setEditingGoal(null);
    setEditTitle('');
    setEditDescription('');
    setEditWhy('');
  };

  const handleSaveEdit = async () => {
    if (!editingGoal || !editTitle.trim()) return;

    await updateGoal(editingGoal.id, {
      title: editTitle.trim(),
      description: editDescription.trim() || undefined,
      why: editWhy.trim() || undefined,
    });
    closeEditModal();
  };

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />

        <View style={[styles.header, { backgroundColor: colors.card }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {userProfile?.firstName ? `${userProfile.firstName}'s Goals` : 'Your Goals'}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.secondary }]}>
            Capture your “why” and keep long-term outcomes visible.
          </Text>
        </View>

        <GoalList goals={goals} onRemoveGoal={removeGoal} onEditGoal={openEditModal} />

        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/(tabs)/addgoal')}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color="white" />
        </TouchableOpacity>
      </SafeAreaView>

      <Modal
        visible={!!editingGoal}
        transparent
        animationType="fade"
        onRequestClose={closeEditModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Goal</Text>
            <View style={styles.modalField}>
              <Text style={[styles.modalLabel, { color: colors.secondary }]}>Goal title</Text>
              <TextInput
                value={editTitle}
                onChangeText={setEditTitle}
                style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
                placeholder="Goal title"
                placeholderTextColor={colors.secondary}
              />
            </View>
            <View style={styles.modalField}>
              <Text style={[styles.modalLabel, { color: colors.secondary }]}>Description</Text>
              <TextInput
                value={editDescription}
                onChangeText={setEditDescription}
                style={[styles.modalTextArea, { color: colors.text, borderColor: colors.border }]}
                placeholder="Optional description"
                placeholderTextColor={colors.secondary}
                multiline
              />
            </View>
            <View style={styles.modalField}>
              <Text style={[styles.modalLabel, { color: colors.secondary }]}>Why</Text>
              <TextInput
                value={editWhy}
                onChangeText={setEditWhy}
                style={[styles.modalTextArea, { color: colors.text, borderColor: colors.border }]}
                placeholder="Why is this goal important?"
                placeholderTextColor={colors.secondary}
                multiline
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.border }]} onPress={closeEditModal}>
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  {
                    backgroundColor: colors.primary,
                    opacity: isSaveDisabled ? 0.5 : 1,
                  },
                ]}
                onPress={handleSaveEdit}
                disabled={isSaveDisabled}
              >
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 90,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 999,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    padding: 24,
    gap: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalField: {
    gap: 8,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  modalTextArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 96,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});


