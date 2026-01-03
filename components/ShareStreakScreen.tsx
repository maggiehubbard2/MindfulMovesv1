import { useHabits } from '@/context/HabitsContext';
import { useTheme } from '@/context/ThemeContext';
import { Quote, quotes } from '@/data/quotes';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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

interface ShareStreakScreenProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * ShareStreakScreen - Celebrates user's longest habit streak and enables sharing
 * 
 * Design Philosophy:
 * - Duolingo-inspired: clean, celebratory, share-worthy
 * - Prominent streak number as hero element
 * - Motivational quote for emotional resonance
 * - Uses user's theme colors for personalization
 * - Minimal branding to keep focus on achievement
 * - Optional sharing - no pressure, just celebration
 * 
 * Architecture:
 * - Uses view-to-image capture for share asset generation
 * - System share sheet for maximum compatibility
 * - Pure component - no side effects on mount/unmount
 * 
 * Usage Example:
 * ```tsx
 * const [showShareScreen, setShowShareScreen] = useState(false);
 * 
 * // Trigger after habit completion or milestone
 * const handleHabitComplete = () => {
 *   const streak = calculateLongestStreak();
 *   if (streak > 0 && streak % 7 === 0) { // Show every 7 days
 *     setShowShareScreen(true);
 *   }
 * };
 * 
 * <ShareStreakScreen
 *   visible={showShareScreen}
 *   onClose={() => setShowShareScreen(false)}
 * />
 * ```
 * 
 * Required Dependencies:
 * - expo-sharing: System share sheet
 * - react-native-view-shot: View-to-image capture
 * 
 * Install with: npm install expo-sharing react-native-view-shot
 */
export default function ShareStreakScreen({ visible, onClose }: ShareStreakScreenProps) {
  const { calculateLongestStreak } = useHabits();
  const { colors } = useTheme();
  const [isGenerating, setIsGenerating] = useState(false);
  const shareViewRef = useRef<View>(null);

  const streak = calculateLongestStreak();

  // Don't show if streak is 0 - no achievement to celebrate
  if (!visible || streak === 0) {
    return null;
  }

  /**
   * Selects a motivational quote that pairs well with streak achievements
   * Prefers quotes about consistency, habits, and progress
   * Falls back to random selection if no specific matches
   */
  const getStreakQuote = (): Quote => {
    // Filter for quotes that resonate with streak/consistency themes
    const streakThemedQuotes = quotes.filter(q => {
      const text = q.text.toLowerCase();
      return (
        text.includes('habit') ||
        text.includes('repeated') ||
        text.includes('consist') ||
        text.includes('day') ||
        text.includes('effort') ||
        text.includes('small') ||
        text.includes('compound')
      );
    });
    
    // Use streak-themed quotes if available, otherwise use all quotes
    const quotePool = streakThemedQuotes.length > 0 ? streakThemedQuotes : quotes;
    const randomIndex = Math.floor(Math.random() * quotePool.length);
   // return quotePool[randomIndex];
    return quotes[randomIndex];
  };

  const selectedQuote = getStreakQuote();

  /**
   * Generates a shareable image from the share view
   * 
   * Creates a high-quality PNG suitable for social sharing
   * Uses square format (1:1) for maximum compatibility across platforms
   * Instagram Stories, regular posts, Twitter, etc. all support square images
   * 
   * @returns Promise<string | null> - File URI of generated image, or null on error
   */
  const createStreakShareImage = async (): Promise<string | null> => {
    if (!shareViewRef.current) {
      return null;
    }

    if (!captureRef) {
      Alert.alert(
        'Package Required',
        'react-native-view-shot is required for sharing. Please install it with: npm install react-native-view-shot',
        [{ text: 'OK' }]
      );
      return null;
    }

    try {
      setIsGenerating(true);

      // Capture the view as a high-quality PNG
      // Square format (1080x1080) works well for most social platforms
      // Instagram Stories can crop square images, regular posts use them as-is
      const uri = await captureRef(shareViewRef.current, {
        format: 'png',
        quality: 1.0,
        result: 'tmpfile',
        // Square format for maximum compatibility
        width: 1080,
        height: 1080,
      });

      return uri;
    } catch (error) {
      console.error('Error generating share image:', error);
      Alert.alert(
        'Error',
        'Failed to generate share image. Please try again.',
        [{ text: 'OK' }]
      );
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Shares the streak image using the system share sheet
   * 
   * Uses Expo Sharing API which opens the native share sheet
   * Users can choose from available apps (Instagram, Twitter, Messages, etc.)
   * Gracefully handles cancellation and errors
   */
  const handleShare = async () => {
    if (!Sharing) {
      Alert.alert(
        'Package Required',
        'expo-sharing is required for sharing. Please install it with: npm install expo-sharing',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      const imageUri = await createStreakShareImage();
      
      if (!imageUri) {
        return;
      }

      // Check if sharing is available on this device
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (!isAvailable) {
        Alert.alert(
          'Sharing Not Available',
          'Sharing is not available on this device.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Open system share sheet
      // Users can choose their preferred app (Instagram, Twitter, Messages, etc.)
      await Sharing.shareAsync(imageUri, {
        mimeType: 'image/png',
        dialogTitle: 'Share your streak! 🎉',
        UTI: 'public.png',
      });

      // Close modal after sharing (user may have cancelled, but that's fine)
      // We don't force them to stay on the screen
      onClose();
    } catch (error: any) {
      // Handle user cancellation gracefully
      if (error?.code === 'E_SHARING_CANCELLED' || error?.message?.includes('cancel')) {
        // User cancelled - that's fine, just close silently
        onClose();
        return;
      }

      console.error('Error sharing streak:', error);
      Alert.alert(
        'Share Failed',
        'Unable to share. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <StatusBar style={colors.background === '#000000' ? 'light' : 'dark'} />
      <View style={styles.modalOverlay}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          {/* Close Button */}
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: colors.card }]}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>

          {/* Share View - This will be captured as an image */}
          <View
            ref={shareViewRef}
            style={[
              styles.shareView,
              {
                backgroundColor: colors.background,
                // Square format for maximum social media compatibility
                aspectRatio: 1,
              },
            ]}
            collapsable={false}
          >
            {/* Subtle gradient overlay using primary color */}
            <View
              style={[
                styles.gradientOverlay,
                { backgroundColor: colors.primary + '10' }, // ~6% opacity
              ]}
            />

            {/* Main Content */}
            <View style={styles.content}>
              {/* Streak Number - Hero Element */}
              <View style={styles.streakContainer}>
                <Text style={[styles.streakNumber, { color: colors.primary }]}>
                  {streak}
                </Text>
                <Text style={[styles.streakLabel, { color: colors.text }]}>
                  Day{streak !== 1 ? 's' : ''} Streak
                </Text>
              </View>

              {/* Quote Section */}
              <View style={styles.quoteContainer}>
                <Text style={[styles.quoteText, { color: colors.text }]}>
                  "{selectedQuote.text}"
                </Text>
                <Text style={[styles.quoteAuthor, { color: colors.secondary }]}>
                  — {selectedQuote.author}
                </Text>
              </View>

              {/* Branding - Subtle footer */}
              <View style={styles.brandingContainer}>
                <Text style={[styles.brandingText, { color: colors.secondary }]}>
                  Mindful Moves
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[
                styles.shareButton,
                {
                  backgroundColor: colors.primary,
                  opacity: isGenerating ? 0.6 : 1,
                },
              ]}
              onPress={handleShare}
              disabled={isGenerating}
            >
              <Ionicons name="share-outline" size={22} color="white" />
              <Text style={styles.shareButtonText}>
                {isGenerating ? 'Generating...' : 'Share Your Streak'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: colors.border }]}
              onPress={onClose}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                Maybe Later
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 8,
    borderRadius: 20,
  },
  shareView: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50,
    position: 'relative',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    zIndex: 1,
  },
  streakContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  streakNumber: {
    fontSize: 100,
    fontWeight: 'bold',
    lineHeight: 120,
    letterSpacing: -2,
  },
  streakLabel: {
    fontSize: 28,
    fontWeight: '600',
    marginTop: 8,
    letterSpacing: 0.5,
  },
  quoteContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
    marginVertical: 30,
    flex: 1,
    justifyContent: 'center',
  },
  quoteText: {
    fontSize: 20,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 30,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  quoteAuthor: {
    fontSize: 15,
    fontWeight: '400',
    textAlign: 'center',
  },
  brandingContainer: {
    marginBottom: 30,
  },
  brandingText: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 1,
    opacity: 0.5,
  },
  actionsContainer: {
    padding: 24,
    gap: 12,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 10,
  },
  shareButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
});

