import { useHabits } from '@/context/HabitsContext';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

export default function SettingsScreen() {
  const { showEmojis, toggleEmojis } = useHabits();
  const { isDarkMode, toggleDarkMode, colors, accentColor, setAccentColor } = useTheme();

  const accentColorOptions = [
    { name: 'Blue', value: 'blue', color: '#007AFF' },
    { name: 'Pink', value: 'pink', color: '#FF2D55' },
    { name: 'Green', value: 'green', color: '#34C759' },
    { name: 'Purple', value: 'purple', color: '#AF52DE' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Display Settings</Text>
        
        <View style={[styles.settingItem, { backgroundColor: colors.card }]}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingTitle, { color: colors.text }]}>Show Emojis</Text>
            <Text style={[styles.settingDescription, { color: colors.secondary }]}>
              Toggle the display of emojis in your habit list
            </Text>
          </View>
          <Switch
            value={showEmojis}
            onValueChange={toggleEmojis}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={showEmojis ? colors.primary : '#f4f3f4'}
          />
        </View>

        <View style={[styles.settingItem, { backgroundColor: colors.card }]}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingTitle, { color: colors.text }]}>Dark Mode</Text>
            <Text style={[styles.settingDescription, { color: colors.secondary }]}>
              Switch between light and dark theme
            </Text>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={toggleDarkMode}
            trackColor={{ false: '#767577', true: colors.primary }}
            thumbColor={isDarkMode ? '#f4f3f4' : '#f4f3f4'}
          />
        </View>

        <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
          <View style={styles.settingInfo}>
            <Ionicons name="color-palette-outline" size={24} color={colors.text} />
            <Text style={[styles.settingText, { color: colors.text }]}>Accent Color</Text>
          </View>
          <View style={styles.colorOptions}>
            {accentColorOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.colorOption,
                  { backgroundColor: option.color },
                  accentColor === option.value && styles.selectedColor,
                ]}
                onPress={() => setAccentColor(option.value as any)}
              >
                {accentColor === option.value && (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
        <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
          <View style={styles.settingInfo}>
            <Ionicons name="information-circle-outline" size={24} color={colors.text} />
            <Text style={[styles.settingText, { color: colors.text }]}>Version</Text>
          </View>
          <Text style={[styles.settingValue, { color: colors.text }]}>1.0.0</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
  },
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  settingText: {
    fontSize: 16,
    marginLeft: 12,
  },
  settingValue: {
    fontSize: 16,
    opacity: 0.7,
  },
  colorOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedColor: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
