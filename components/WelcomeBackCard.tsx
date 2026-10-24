import { useOnboarding } from '@/context/OnboardingContext';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const FEATURES = [
  'Track daily habits.',
  'See your progress on the calendar.',
  'Build consistency at your own pace.',
  'Customize your experience in Settings.',
];

export default function WelcomeBackCard() {
  const { colors } = useTheme();
  const { showWelcomeBack, acknowledgeWelcomeBack } = useOnboarding();
  const [visible, setVisible] = useState(false);
  const openedRef = useRef(false);

  useEffect(() => {
    if (!showWelcomeBack || openedRef.current) return;
    openedRef.current = true;
    setVisible(true);
    // The cold-start splash covers the dashboard for about 5.5s. Wait until the
    // card can actually be seen before recording it, so a force-quit during
    // splash does not consume the one showing.
    const seenTimer = setTimeout(() => {
      acknowledgeWelcomeBack();
    }, 6000);
    return () => clearTimeout(seenTimer);
  }, [acknowledgeWelcomeBack, showWelcomeBack]);

  if (!visible) return null;

  const dismiss = () => {
    acknowledgeWelcomeBack();
    setVisible(false);
  };

  return (
    <View
      style={[styles.card, { backgroundColor: colors.card }]}
      accessibilityRole="summary"
    >
      <Text style={[styles.headline, { color: colors.text }]} accessibilityRole="header">
        A fresh start, whenever you need it.
      </Text>
      <Text style={[styles.body, { color: colors.text }]}>
        Your progress isn't about being perfect. It's about making small moves, finding your rhythm, and coming back when life gets busy.
      </Text>
      <View style={styles.features}>
        {FEATURES.map((feature) => (
          <View key={feature} style={styles.featureRow}>
            <Ionicons name="checkmark" size={18} color={colors.primary} />
            <Text style={[styles.featureText, { color: colors.text }]}>{feature}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: colors.primary }]}
        onPress={dismiss}
        accessibilityRole="button"
        accessibilityLabel="Let's make a move"
      >
        <Text style={styles.primaryButtonText}>Let's make a move</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={dismiss}
        accessibilityRole="button"
        accessibilityLabel="Maybe later"
      >
        <Text style={[styles.secondaryButtonText, { color: colors.secondary }]}>Maybe later</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headline: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  features: {
    gap: 10,
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
  },
  primaryButton: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 17,
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
