import HabitList from '@/components/HabitList';
import { useAuth } from '@/context/AuthContext';
import { useHabits } from '@/context/HabitsContext';
import { ThemeContextType, useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HabitsScreen() {
  const { habits, selectedDate, setSelectedDate, toggleHabit, removeHabit, updateHabit, reorderHabits, getHabitsForDate, canEditDate } = useHabits();
  const { colors, isDarkMode }: ThemeContextType = useTheme();
  const { userProfile } = useAuth();
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const displayHabits = getHabitsForDate(selectedDate);
  const isEditable = canEditDate(selectedDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedDateNormalized = new Date(selectedDate);
  selectedDateNormalized.setHours(0, 0, 0, 0);
  const isToday = selectedDateNormalized.getTime() === today.getTime();
  
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  };
  
  const getDateLabel = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    if (targetDate.getTime() === today.getTime()) {
      return 'Today';
    }
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (targetDate.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    }
    return formatDate(date);
  };
  
  const navigateDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    if (canEditDate(newDate)) {
      setSelectedDate(newDate);
    }
  };
  
  const canNavigateBack = () => {
    const prevDate = new Date(selectedDate);
    prevDate.setDate(prevDate.getDate() - 1);
    return canEditDate(prevDate);
  };
  
  const canNavigateForward = () => {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + 1);
    return canEditDate(nextDate);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          <View style={styles.headerTop}>
            <View style={styles.headerTextContainer}>
              <Text style={[styles.greeting, { color: colors.text }]}>
                {userProfile?.firstName ? `${userProfile.firstName}'s Habits` : 'Your Habits'}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/addhabit')}
            >
              <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Date Selector */}
        <View style={[styles.dateSelector, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            style={styles.dateNavButton}
            onPress={() => navigateDate(-1)}
            disabled={!canNavigateBack()}
          >
            <Ionicons 
              name="chevron-back" 
              size={20} 
              color={canNavigateBack() ? colors.primary : colors.secondary} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={[styles.dateText, { color: colors.text }]}>
              {getDateLabel(selectedDate)}
            </Text>
            {!isEditable && (
              <Text style={[styles.viewOnlyLabel, { color: colors.secondary }]}>
                (View Only)
              </Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.dateNavButton}
            onPress={() => navigateDate(1)}
            disabled={!canNavigateForward()}
          >
            <Ionicons 
              name="chevron-forward" 
              size={20} 
              color={canNavigateForward() ? colors.primary : colors.secondary} 
            />
          </TouchableOpacity>
        </View>
        
        {!isEditable && (
          <View style={[styles.warningBanner, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="information-circle" size={16} color={colors.primary} />
            <Text style={[styles.warningText, { color: colors.text }]}>
              You can only edit habits from today and up to 2 days prior
            </Text>
          </View>
        )}
        
        <HabitList 
          habits={displayHabits} 
          onToggleHabit={(id) => toggleHabit(id, selectedDate)}
          onRemoveHabit={removeHabit}
          onUpdateHabit={updateHabit}
          onReorderHabits={reorderHabits}
          isEditable={isEditable}
        />
        
        {/* Floating Action Button - only show for today */}
        {isToday && (
          <TouchableOpacity
            style={[styles.fab, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/addhabit')}
          >
            <Ionicons name="add" size={28} color="white" />
          </TouchableOpacity>
        )}
        
        {/* Date Picker Modal */}
        <Modal
          visible={showDatePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Select Date</Text>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.dateOptions}>
                {[-2, -1, 0].map(daysOffset => {
                  const date = new Date();
                  date.setDate(date.getDate() + daysOffset);
                  date.setHours(0, 0, 0, 0);
                  const isSelected = selectedDateNormalized.getTime() === date.getTime();
                  const canEdit = canEditDate(date);
                  
                  return (
                    <TouchableOpacity
                      key={daysOffset}
                      style={[
                        styles.dateOption,
                        { 
                          backgroundColor: isSelected ? colors.primary : colors.card,
                          borderColor: colors.border,
                        }
                      ]}
                      onPress={() => {
                        setSelectedDate(date);
                        setShowDatePicker(false);
                      }}
                    >
                      <Text style={[
                        styles.dateOptionText,
                        { color: isSelected ? 'white' : colors.text }
                      ]}>
                        {daysOffset === 0 ? 'Today' : daysOffset === -1 ? 'Yesterday' : formatDate(date)}
                      </Text>
                      {!canEdit && (
                        <Text style={[
                          styles.dateOptionSubtext,
                          { color: isSelected ? 'rgba(255,255,255,0.7)' : colors.secondary }
                        ]}>
                          View Only
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  dateNavButton: {
    padding: 8,
  },
  dateButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
  },
  viewOnlyLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    gap: 8,
  },
  warningText: {
    fontSize: 12,
    flex: 1,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 80, // Adjusted to be above tab bar
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 1000, // Added zIndex for visibility
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  dateOptions: {
    gap: 12,
  },
  dateOption: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  dateOptionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  dateOptionSubtext: {
    fontSize: 12,
    marginTop: 4,
  },
});

