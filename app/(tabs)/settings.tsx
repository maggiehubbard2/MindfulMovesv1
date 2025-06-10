import { useHabits } from '@/context/HabitsContext';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const { showEmojis, isDarkMode, toggleEmojis, toggleDarkMode } = useHabits();

  const backgroundColor = isDarkMode ? '#1a1a1a' : '#f5f5f5';
  const cardBackgroundColor = isDarkMode ? '#2a2a2a' : 'white';
  const textColor = isDarkMode ? '#ffffff' : '#333333';
  const descriptionColor = isDarkMode ? '#999999' : '#666666';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Display Settings</Text>
        
        <View style={[styles.settingItem, { backgroundColor: cardBackgroundColor }]}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingTitle, { color: textColor }]}>Show Emojis</Text>
            <Text style={[styles.settingDescription, { color: descriptionColor }]}>
              Toggle the display of emojis in your habit list
            </Text>
          </View>
          <Switch
            value={showEmojis}
            onValueChange={toggleEmojis}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={showEmojis ? '#007AFF' : '#f4f3f4'}
          />
        </View>

        <View style={[styles.settingItem, { backgroundColor: cardBackgroundColor }]}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingTitle, { color: textColor }]}>Dark Mode</Text>
            <Text style={[styles.settingDescription, { color: descriptionColor }]}>
              Switch between light and dark theme
            </Text>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={toggleDarkMode}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={isDarkMode ? '#007AFF' : '#f4f3f4'}
          />
        </View>
      </View>
    </SafeAreaView>
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
});
