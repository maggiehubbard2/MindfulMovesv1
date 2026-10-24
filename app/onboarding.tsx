import { FREE_HABIT_LIMIT } from '@/config/subscription';
import { useAuth } from '@/context/AuthContext';
import { useHabits } from '@/context/HabitsContext';
import { useOnboarding } from '@/context/OnboardingContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { useTheme } from '@/context/ThemeContext';
import { habitNameKey, type OnboardingDraftHabit } from '@/utils/onboardingClassification';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const STARTER_HABITS: { name: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { name: 'Drink a glass of water', icon: 'water-outline' },
  { name: 'Read 5 pages', icon: 'library-outline' },
  { name: 'Move my body for 10 minutes', icon: 'fitness-outline' },
  { name: 'Journal for 5 minutes', icon: 'book-outline' },
  { name: 'Pray or practice gratitude', icon: 'heart-outline' },
];

type Step = 1 | 2 | 3;

export default function OnboardingScreen() {
  const { colors, isDarkMode } = useTheme();
  const { userProfile } = useAuth();
  const { habits, addHabits } = useHabits();
  const { isPro } = useSubscription();
  const { draft, saveDraft, completeOnboarding } = useOnboarding();
  const [step, setStep] = useState<Step>(draft?.step ?? 1);
  const [selected, setSelected] = useState<OnboardingDraftHabit[]>(draft?.selected ?? []);
  const [showCustom, setShowCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [customError, setCustomError] = useState('');
  const [saving, setSaving] = useState(false);
  const finishedRef = useRef(false);

  const isAdmin = userProfile?.isAdmin === true;
  const maxSelectable = isPro || isAdmin
    ? 3
    : Math.min(3, Math.max(0, FREE_HABIT_LIMIT - habits.length));

  const existingNames = useMemo(
    () => new Set(habits.map((habit) => habitNameKey(habit.name))),
    [habits],
  );

  useEffect(() => {
    setSelected((current) => current.slice(0, maxSelectable));
  }, [maxSelectable]);

  useEffect(() => {
    if (finishedRef.current) return;
    void saveDraft({ step, selected });
  }, [saveDraft, selected, step]);

  const goToDashboard = async () => {
    finishedRef.current = true;
    await completeOnboarding();
    router.replace('/dashboard');
  };

  const toggleSuggestion = (name: string) => {
    if (existingNames.has(habitNameKey(name))) return;
    setSelected((current) => {
      const exists = current.some((habit) => habitNameKey(habit.name) === habitNameKey(name));
      if (exists) {
        return current.filter((habit) => habitNameKey(habit.name) !== habitNameKey(name));
      }
      if (current.length >= maxSelectable) return current;
      return [...current, { name }];
    });
  };

  const addCustomHabit = (): OnboardingDraftHabit[] | null => {
    const name = customName.trim();
    if (!name) return selected;
    const key = habitNameKey(name);
    if (existingNames.has(key) || selected.some((habit) => habitNameKey(habit.name) === key)) {
      setCustomError('You already added this habit.');
      return null;
    }
    if (selected.length >= maxSelectable) {
      setCustomError(`Choose up to ${maxSelectable}.`);
      return null;
    }
    const description = customDescription.trim();
    const next = [...selected, { name, description: description || undefined }];
    setSelected(next);
    setCustomName('');
    setCustomDescription('');
    setCustomError('');
    setShowCustom(false);
    return next;
  };

  const continueFromSelection = () => {
    const name = customName.trim();
    if (name) {
      const next = addCustomHabit();
      if (!next) return;
      if (next.length === 0) return;
      setStep(3);
      return;
    }
    if (selected.length === 0) return;
    setStep(3);
  };

  const handleStart = async () => {
    if (saving || selected.length === 0) return;
    setSaving(true);
    try {
      const result = await addHabits(selected);
      if (result.added === 0 && result.blockedByLimit) {
        setSaving(false);
        return;
      }
      await goToDashboard();
    } catch (error) {
      if (__DEV__) {
        console.warn('[onboarding] Could not save starter habits', error);
      }
      setSaving(false);
      Alert.alert('Could not save habits', 'Please try again.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.topBar}>
          {step > 1 ? (
            <TouchableOpacity
              onPress={() => setStep((current) => (current > 1 ? ((current - 1) as Step) : current))}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Back"
              disabled={saving}
            >
              <Text style={[styles.backText, { color: colors.primary }]}>Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.backButton} />
          )}
          <Text style={[styles.stepLabel, { color: colors.secondary }]}>Step {step} of 3</Text>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 1 && (
            <View style={styles.welcome}>
              <Image
                source={require('../assets/images/icon.png')}
                style={styles.logo}
                contentFit="cover"
                accessibilityLabel="Mindful Moves"
              />
              <Text style={[styles.wordmark, { color: colors.text }]}>Mindful Moves</Text>
              <Text style={[styles.headline, { color: colors.text }]} accessibilityRole="header">
                You can always begin again.
              </Text>
              <Text style={[styles.body, { color: colors.text }]}>
                Life happens. Routines fall off. That's okay. Mindful Moves helps you build momentum through small, intentional actions — one day at a time.
              </Text>
            </View>
          )}

          {step === 2 && (
            <View>
              <Text style={[styles.headline, { color: colors.text }]} accessibilityRole="header">
                What would you like to work on?
              </Text>
              <Text style={[styles.support, { color: colors.secondary }]}>
                {maxSelectable === 0
                  ? 'You already have as many habits as the free plan allows. You can keep going and add more later.'
                  : 'Choose up to 3. One is enough, or skip and add a habit later.'}
              </Text>
              {maxSelectable > 0 && STARTER_HABITS.map((habit) => {
                const alreadySaved = existingNames.has(habitNameKey(habit.name));
                const isSelected = selected.some((item) => habitNameKey(item.name) === habitNameKey(habit.name));
                const atCap = !isSelected && selected.length >= maxSelectable;
                const disabled = alreadySaved || atCap;
                return (
                  <TouchableOpacity
                    key={habit.name}
                    style={[
                      styles.choice,
                      {
                        backgroundColor: colors.card,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => toggleSuggestion(habit.name)}
                    disabled={disabled && !isSelected}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected, disabled: disabled && !isSelected }}
                    accessibilityLabel={habit.name}
                  >
                    <Ionicons
                      name={habit.icon}
                      size={22}
                      color={disabled && !isSelected ? colors.border : colors.primary}
                    />
                    <Text style={[styles.choiceText, { color: colors.text, opacity: disabled && !isSelected ? 0.5 : 1 }]}>
                      {habit.name}
                    </Text>
                    {alreadySaved ? (
                      <Text style={[styles.choiceMeta, { color: colors.secondary }]}>Added</Text>
                    ) : isSelected ? (
                      <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                    ) : null}
                  </TouchableOpacity>
                );
              })}

              {selected
                .filter((habit) => !STARTER_HABITS.some((starter) => habitNameKey(starter.name) === habitNameKey(habit.name)))
                .map((habit) => (
                  <View
                    key={habit.name}
                    style={[styles.choice, { backgroundColor: colors.card, borderColor: colors.primary }]}
                  >
                    <Ionicons name="create-outline" size={22} color={colors.primary} />
                    <View style={styles.choiceCopy}>
                      <Text style={[styles.choiceText, { color: colors.text }]}>{habit.name}</Text>
                      {habit.description ? (
                        <Text style={[styles.choiceMeta, { color: colors.secondary }]}>{habit.description}</Text>
                      ) : null}
                    </View>
                    <TouchableOpacity
                      onPress={() => setSelected((current) => current.filter((item) => item.name !== habit.name))}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${habit.name}`}
                      hitSlop={8}
                    >
                      <Ionicons name="close-circle" size={22} color={colors.secondary} />
                    </TouchableOpacity>
                  </View>
                ))}

              {maxSelectable > 0 && (
                <View style={styles.customBlock}>
                  {showCustom ? (
                    <>
                      <TextInput
                        style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                        placeholder="Habit name..."
                        placeholderTextColor={colors.secondary}
                        value={customName}
                        onChangeText={(value) => {
                          setCustomName(value);
                          if (customError) setCustomError('');
                        }}
                        accessibilityLabel="Custom habit name"
                      />
                      <TextInput
                        style={[styles.textArea, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                        placeholder="Description (optional)..."
                        placeholderTextColor={colors.secondary}
                        value={customDescription}
                        onChangeText={setCustomDescription}
                        multiline
                        accessibilityLabel="Custom habit description"
                      />
                      {customError ? <Text style={styles.errorText}>{customError}</Text> : null}
                      <TouchableOpacity
                        style={styles.inlineButton}
                        onPress={() => {
                          addCustomHabit();
                        }}
                        disabled={!customName.trim()}
                        accessibilityRole="button"
                        accessibilityLabel="Add custom habit"
                      >
                        <Text style={[styles.inlineButtonText, { color: customName.trim() ? colors.primary : colors.border }]}>
                          Add custom habit
                        </Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity
                      style={styles.inlineButton}
                      onPress={() => setShowCustom(true)}
                      disabled={selected.length >= maxSelectable}
                      accessibilityRole="button"
                      accessibilityLabel="Create a custom habit"
                    >
                      <Text style={[styles.inlineButtonText, { color: selected.length >= maxSelectable ? colors.border : colors.primary }]}>
                        Create a custom habit
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          )}

          {step === 3 && (
            <View>
              <Text style={[styles.headline, { color: colors.text }]} accessibilityRole="header">
                Your next move starts here.
              </Text>
              <Text style={[styles.support, { color: colors.secondary }]}>
                {selected.length === 0
                  ? 'Nothing selected yet. Go back to choose a habit, or start with an empty dashboard.'
                  : 'These are ready to save. You can set a reminder later in Settings.'}
              </Text>
              {selected.map((habit) => (
                <View
                  key={habit.name}
                  style={[styles.choice, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <View style={styles.choiceCopy}>
                    <Text style={[styles.choiceText, { color: colors.text }]}>{habit.name}</Text>
                    {habit.description ? (
                      <Text style={[styles.choiceMeta, { color: colors.secondary }]}>{habit.description}</Text>
                    ) : null}
                  </View>
                  <TouchableOpacity
                    onPress={() => setSelected((current) => current.filter((item) => item.name !== habit.name))}
                    disabled={saving}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${habit.name}`}
                    hitSlop={8}
                  >
                    <Ionicons name="close-circle" size={22} color={colors.secondary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          {step === 1 && (
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              onPress={() => setStep(2)}
              accessibilityRole="button"
              accessibilityLabel="Let's make a move"
            >
              <Text style={styles.primaryButtonText}>Let's make a move</Text>
            </TouchableOpacity>
          )}

          {step === 2 && (
            <>
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  {
                    backgroundColor: maxSelectable === 0 || selected.length > 0 || customName.trim()
                      ? colors.primary
                      : colors.border,
                  },
                ]}
                onPress={() => {
                  if (maxSelectable === 0) {
                    void goToDashboard();
                    return;
                  }
                  continueFromSelection();
                }}
                disabled={maxSelectable > 0 && selected.length === 0 && !customName.trim()}
                accessibilityRole="button"
                accessibilityLabel="Continue"
              >
                <Text style={styles.primaryButtonText}>Continue</Text>
              </TouchableOpacity>
              {maxSelectable > 0 && (
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => {
                    void goToDashboard();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Skip for now"
                >
                  <Text style={[styles.secondaryButtonText, { color: colors.secondary }]}>Skip for now</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {step === 3 && (
            <>
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  { backgroundColor: selected.length > 0 && !saving ? colors.primary : colors.border },
                ]}
                onPress={() => {
                  void handleStart();
                }}
                disabled={selected.length === 0 || saving}
                accessibilityRole="button"
                accessibilityLabel="Start moving"
              >
                {saving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.primaryButtonText}>Start moving</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  void goToDashboard();
                }}
                disabled={saving}
                accessibilityRole="button"
                accessibilityLabel="Skip for now"
              >
                <Text style={[styles.secondaryButtonText, { color: colors.secondary }]}>Skip for now</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  topBar: {
    minHeight: 44,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    minWidth: 64,
    minHeight: 44,
    justifyContent: 'center',
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
  },
  stepLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    flexGrow: 1,
  },
  welcome: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 12,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 16,
    marginBottom: 20,
  },
  wordmark: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  headline: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 38,
    marginBottom: 16,
  },
  body: {
    fontSize: 17,
    lineHeight: 26,
  },
  support: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 20,
  },
  choice: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  choiceCopy: {
    flex: 1,
  },
  choiceText: {
    flex: 1,
    flexShrink: 1,
    fontSize: 16,
    lineHeight: 22,
  },
  choiceMeta: {
    fontSize: 13,
    lineHeight: 18,
  },
  customBlock: {
    marginTop: 8,
    gap: 12,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  inlineButton: {
    minHeight: 44,
    justifyContent: 'center',
  },
  inlineButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 13,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 8,
  },
  primaryButton: {
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
