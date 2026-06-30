import { useHabits } from '@/context/HabitsContext';
import { useTheme } from '@/context/ThemeContext';
import { Quote, quotes } from '@/data/quotes';
import { buildWeekStreakData, WeekStreakDay } from '@/utils/streak';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// Dynamically import sharing modules with error handling
let Sharing: any = null;
let captureRef: any = null;

try {
  Sharing = require('expo-sharing');
} catch (error) {
  console.warn('expo-sharing not available:', error);
}

try {
  const viewShot = require('react-native-view-shot');
  captureRef = viewShot.captureRef;
} catch (error) {
  console.warn('react-native-view-shot not available:', error);
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ShareStreakScreenProps {
  visible: boolean;
  onClose: () => void;
  /**
   * Optional override for the calendar strip.
   * Defaults to the current Mon–Sun week from habit completion data.
   */
  weekData?: WeekStreakDay[];
}

/**
 * ShareStreakScreen - Celebrates user's current habit streak and enables sharing
 *
 * Redesigned to be a full-screen 9:16 story-format share screen, inspired by
 * Duolingo's streak celebration UI. Key improvements:
 * - Full portrait (9:16) format for Instagram Stories
 * - Animated entrance for the streak number
 * - Weekly calendar strip showing recent consistency
 * - Motivational quote from the user's quote bank
 * - Dramatic typography and generous spacing
 */
export default function ShareStreakScreen({
  visible,
  onClose,
  weekData,
}: ShareStreakScreenProps) {
  const { habits, calculateCurrentStreak } = useHabits();
  const { colors } = useTheme();
  const [isGenerating, setIsGenerating] = useState(false);
  const shareViewRef = useRef<View>(null);

  // Animation values
  const numberScale = useRef(new Animated.Value(0.5)).current;
  const numberOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  const streak = calculateCurrentStreak();
  const days = React.useMemo(
    () => weekData ?? buildWeekStreakData(habits),
    [weekData, habits]
  );

  useEffect(() => {
    if (visible) {
      // Reset animations
      numberScale.setValue(0.5);
      numberOpacity.setValue(0);
      contentOpacity.setValue(0);
      buttonOpacity.setValue(0);

      // Sequence: number pops in first, then content fades, then button
      Animated.sequence([
        Animated.delay(200),
        Animated.parallel([
          Animated.spring(numberScale, {
            toValue: 1,
            tension: 60,
            friction: 7,
            useNativeDriver: true,
          }),
          Animated.timing(numberOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible || streak === 0) return null;

  /**
   * Picks a quote that resonates with streak/consistency themes.
   * Uses the streak count as a seed for deterministic selection per milestone.
   */
  const getStreakQuote = (): Quote => {
    const streakThemed = quotes.filter((q) => {
      const t = q.text.toLowerCase();
      return (
        t.includes('habit') ||
        t.includes('repeated') ||
        t.includes('consist') ||
        t.includes('day') ||
        t.includes('effort') ||
        t.includes('small') ||
        t.includes('compound') ||
        t.includes('sum')
      );
    });
    const pool = streakThemed.length > 0 ? streakThemed : quotes;
    // Use streak as a deterministic seed so the quote stays stable for a given milestone
    return pool[streak % pool.length];
  };

  const selectedQuote = getStreakQuote();

  const createStreakShareImage = async (): Promise<string | null> => {
    if (!shareViewRef.current) return null;

    if (!captureRef) {
      Alert.alert(
        'Package Required',
        'react-native-view-shot is required for sharing. Install with: npm install react-native-view-shot',
        [{ text: 'OK' }]
      );
      return null;
    }

    try {
      setIsGenerating(true);
      const uri = await captureRef(shareViewRef.current, {
        format: 'png',
        quality: 1.0,
        result: 'tmpfile',
        width: 1080,
        height: 1920, // 9:16 portrait for Instagram Stories
      });
      return uri;
    } catch (error) {
      console.error('Error generating share image:', error);
      Alert.alert('Error', 'Failed to generate share image. Please try again.', [{ text: 'OK' }]);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    if (!Sharing) {
      Alert.alert(
        'Package Required',
        'expo-sharing is required. Install with: npm install expo-sharing',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      const imageUri = await createStreakShareImage();
      if (!imageUri) return;

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Sharing Not Available', 'Sharing is not available on this device.', [
          { text: 'OK' },
        ]);
        return;
      }

      await Sharing.shareAsync(imageUri, {
        mimeType: 'image/png',
        dialogTitle: 'Share your streak! 🔥',
        UTI: 'public.png',
      });

      onClose();
    } catch (error: any) {
      if (error?.code === 'E_SHARING_CANCELLED' || error?.message?.includes('cancel')) {
        onClose();
        return;
      }
      console.error('Error sharing streak:', error);
      Alert.alert('Share Failed', 'Unable to share. Please try again.', [{ text: 'OK' }]);
    }
  };

  const isDark = colors.background === '#000000' || colors.background === '#0a0a0a';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.modalOverlay}>
        {/* ── Shareable content area (9:16) ── */}
        <View
          ref={shareViewRef}
          collapsable={false}
          style={[styles.shareView, { backgroundColor: colors.background }]}
        >
          {/* Subtle top-right accent blob */}
          <View
            style={[styles.accentBlob, { backgroundColor: colors.primary + '18' }]}
          />

          {/* ── Streak number hero ── */}
          <Animated.View
            style={[
              styles.heroSection,
              { opacity: numberOpacity, transform: [{ scale: numberScale }] },
            ]}
          >
            {/* Fire emoji — big and unapologetic */}
            <Text style={styles.fireEmoji}>🔥</Text>

            <Text style={[styles.streakNumber, { color: colors.primary }]}>
              {streak}
            </Text>
            <Text style={[styles.streakLabel, { color: colors.text }]}>
              Day{streak !== 1 ? 's' : ''} Streak
            </Text>
          </Animated.View>

          {/* ── Weekly calendar strip ── */}
          <Animated.View style={[styles.calendarSection, { opacity: contentOpacity }]}>
            <View style={styles.calendarRow}>
              {days.map((day, i) => (
                <View key={i} style={styles.dayColumn}>
                  <Text style={[styles.dayLabel, { color: colors.secondary }]}>
                    {day.label}
                  </Text>
                  <View
                    style={[
                      styles.dayPill,
                      day.completed
                        ? { backgroundColor: colors.primary }
                        : { backgroundColor: colors.card ?? colors.secondary + '22' },
                    ]}
                  >
                    {day.completed && (
                      <Ionicons name="checkmark" size={14} color="white" />
                    )}
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* ── Motivational quote ── */}
          <Animated.View style={[styles.quoteSection, { opacity: contentOpacity }]}>
            <Text style={[styles.quoteText, { color: colors.text }]}>
              "{selectedQuote.text}"
            </Text>
            <Text style={[styles.quoteAuthor, { color: colors.secondary }]}>
              — {selectedQuote.author}
            </Text>
          </Animated.View>

          {/* ── Branding footer ── */}
          <Animated.View style={[styles.brandingRow, { opacity: contentOpacity }]}>
            <View style={[styles.brandDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.brandingText, { color: colors.secondary }]}>
              Mindful Moves
            </Text>
          </Animated.View>
        </View>

        {/* ── Buttons (outside shareable area) ── */}
        <Animated.View
          style={[
            styles.actionsContainer,
            { backgroundColor: colors.background, opacity: buttonOpacity },
          ]}
        >
          {/* Close button top-right */}
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: colors.card ?? colors.secondary + '22' }]}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={20} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.shareButton,
              { backgroundColor: colors.primary, opacity: isGenerating ? 0.6 : 1 },
            ]}
            onPress={handleShare}
            disabled={isGenerating}
            activeOpacity={0.85}
          >
            <Ionicons name="share-outline" size={20} color="white" />
            <Text style={styles.shareButtonText}>
              {isGenerating ? 'Generating…' : 'Share Your Streak'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={styles.laterButton}>
            <Text style={[styles.laterText, { color: colors.secondary }]}>Maybe Later</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'flex-end',
  },

  // ── Share view: fills most of the screen in 9:16 proportion ──
  shareView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 80,
    paddingBottom: 48,
    paddingHorizontal: 32,
    position: 'relative',
    overflow: 'hidden',
  },

  accentBlob: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
  },

  // ── Hero: fire + number + label ──
  heroSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  fireEmoji: {
    fontSize: 72,
    marginBottom: 8,
  },
  streakNumber: {
    fontSize: 130,
    fontWeight: '800',
    lineHeight: 140,
    letterSpacing: -4,
    includeFontPadding: false,
  },
  streakLabel: {
    fontSize: 26,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 4,
  },

  // ── Weekly calendar strip ──
  calendarSection: {
    width: '100%',
    alignItems: 'center',
  },
  calendarRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  dayColumn: {
    alignItems: 'center',
    gap: 6,
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  dayPill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Quote ──
  quoteSection: {
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 10,
  },
  quoteText: {
    fontSize: 17,
    fontWeight: '400',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 26,
    opacity: 0.9,
  },
  quoteAuthor: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.3,
  },

  // ── Branding ──
  brandingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  brandingText: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 1.5,
    opacity: 0.5,
    textTransform: 'uppercase',
  },

  // ── Buttons (outside shareable area) ──
  actionsContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    gap: 12,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 24,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 17,
    borderRadius: 16,
    gap: 10,
    marginTop: 8,
  },
  shareButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  laterButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  laterText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
