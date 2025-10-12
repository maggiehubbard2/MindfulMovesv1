import { useTheme } from '@/context/ThemeContext';
import { Picker } from 'emoji-mart-native';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Add type declaration for emoji-mart-native
declare module 'emoji-mart-native';

interface EmojiData {
  id: string;
  name: string;
  native: string;
  unified: string;
  keywords: string[];
  shortcodes: string;
}

interface EmojiPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
}

export default function EmojiPicker({ visible, onClose, onSelect }: EmojiPickerProps) {
  const { colors, isDarkMode } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={[styles.modalContainer, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
        <View style={[styles.pickerContainer, { backgroundColor: colors.card }]}>
          <View style={styles.header}>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.primary }]}
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          <Picker
            onSelect={(emoji: EmojiData) => {
              onSelect(emoji.native);
              onClose();
            }}
            showPreview={false}
            showSkinTones={true}
            theme={isDarkMode ? 'dark' : 'light'}
            style={styles.picker}
            custom={{
              search: {
                backgroundColor: colors.background,
                borderRadius: 12,
                padding: 8,
                margin: 8,
                borderWidth: 1,
                borderColor: colors.border,
                color: colors.text,
                fontSize: 16,
                height: 40,
              },
              category: {
                backgroundColor: colors.card,
                color: colors.text,
                padding: 4,
                height: 36,
                fontSize: 14,
              },
              emoji: {
                fontSize: 32,
                padding: 6,
                width: 48,
                height: 48,
              },
              skinTone: {
                backgroundColor: colors.card,
                color: colors.text,
                padding: 4,
                height: 36,
              },
              preview: {
                backgroundColor: colors.card,
                color: colors.text,
                height: 0,
              },
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    width: '90%',
    height: '70%',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  picker: {
    flex: 1,
  },
}); 