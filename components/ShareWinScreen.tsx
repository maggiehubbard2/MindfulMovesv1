import { useHabits } from '@/context/HabitsContext';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ViewShot, { captureRef } from 'react-native-view-shot';

const AFFIRMATIONS = [
  'Another day I showed up for myself.',
  'Consistency over perfection.',
  'We don\'t rise to the level of our goals — we fall to the level of our systems.',
];

const { width: WINDOW_WIDTH } = Dimensions.get('window');
const STORY_WIDTH = 1080;
const STORY_HEIGHT = 1920;
const SCALE = STORY_WIDTH / WINDOW_WIDTH; // Scale factor for responsive design
const SAFE_MARGIN_TOP = 80 * SCALE;
const SAFE_MARGIN_BOTTOM = 80 * SCALE;
const SAFE_MARGIN_HORIZONTAL = 60 * SCALE;

interface ShareWinScreenProps {
  visible: boolean;
  onClose: () => void;
}

export default function ShareWinScreen({ visible, onClose }: ShareWinScreenProps) {
  const { colors, isDarkMode, accentColor, customAccentColor } = useTheme();
  const { habits } = useHabits();
  const viewShotRef = useRef<ViewShot>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [affirmation] = useState(() => {
    const randomAffirmation = AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)];
    return `${randomAffirmation} Keep up the good work!`;
  });

  // Get user's accent color
  const getAccentColor = () => {
    if (accentColor === 'custom') {
      return customAccentColor;
    }
    const accentColors = {
      blue: '#007AFF',
      pink: '#ff2dbe',
      green: '#34C759',
      purple: '#AF52DE',
    };
    return accentColors[accentColor] || '#007AFF';
  };

  const accentColorValue = getAccentColor();

  // Calculate streak based on consecutive days with at least one habit logged
  const calculateOverallStreak = (): number => {
    if (habits.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // Check if at least one habit was logged today
    const hasLoggedToday = habits.some(habit => {
      const habitExisted = new Date(habit.createdAt) <= today;
      if (!habitExisted) return false; // Habit didn't exist yet
      return (habit.completionDates || []).includes(todayStr);
    });

    // Start counting from today if logged today, otherwise from yesterday
    let currentDate = new Date(today);
    if (!hasLoggedToday) {
      currentDate.setDate(currentDate.getDate() - 1);
    }

    let streak = 0;

    // Count consecutive days going backwards where at least one habit was logged
    for (let i = 0; i < 365; i++) { // Limit to 365 days to prevent infinite loops
      const dateStr = currentDate.toISOString().split('T')[0];

      // Check if at least one habit was logged on this date
      const hasLogged = habits.some(habit => {
        const habitExisted = new Date(habit.createdAt) <= currentDate;
        if (!habitExisted) return false; // Habit didn't exist yet
        return (habit.completionDates || []).includes(dateStr);
      });

      if (hasLogged) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  };

  const streak = calculateOverallStreak();

  // Generate and share the image
  const handleShare = async () => {
    if (!viewShotRef.current) return;

    setIsGenerating(true);
    try {
      // Capture the view as an image
      const uri = await captureRef(viewShotRef, {
        format: 'png',
        quality: 1.0,
        width: STORY_WIDTH,
        height: STORY_HEIGHT,
      });

      if (!uri) {
        throw new Error('Failed to capture image');
      }

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Error', 'Sharing is not available on this device.');
        setIsGenerating(false);
        return;
      }

      // Share the image
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Share your win!',
      });
    } catch (error) {
      console.error('Error sharing image:', error);
      Alert.alert('Error', 'Failed to share image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Background gradient colors based on theme
  const gradientColors = isDarkMode
    ? ['#000000', '#1a1a1a', '#000000'] // Black gradient for dark mode
    : ['#FFFFFF', '#F5F5F5', '#FFFFFF']; // White gradient for light mode

  // Text color based on theme
  const textColor = isDarkMode ? '#FFFFFF' : '#000000';
  const secondaryTextColor = isDarkMode ? '#CCCCCC' : '#666666';

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Close button */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close-circle" size={32} color="white" />
        </TouchableOpacity>

        {/* Image content to be captured */}
        <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1.0 }} style={styles.viewShotContainer}>
          <View style={styles.imageContent}>
            <LinearGradient
              colors={gradientColors}
              style={styles.gradientContainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            >
              {/* Safe area content */}
              <View style={styles.safeContent}>
                {/* Affirmation text */}
                <View style={styles.affirmationContainer}>
                  <Text 
                    style={[styles.affirmationText, { color: textColor }]}
                    textBreakStrategy="simple"
                    allowFontScaling={false}
                  >
                    {affirmation}
                  </Text>
                </View>

                {/* Streak display */}
                <View style={styles.streakContainer}>
                  <Text style={[styles.streakNumber, { color: accentColorValue }]}>
                    {streak}
                  </Text>
                  <Text style={[styles.streakLabel, { color: secondaryTextColor }]}>
                    Day Streak
                  </Text>
                </View>

                {/* Branding at bottom */}
                <View style={styles.brandingContainer}>
                  <Text style={[styles.brandingText, { color: accentColorValue }]}>
                    @mindfulmoves.app
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        </ViewShot>

        {/* Share button */}
        <TouchableOpacity
          style={[styles.shareButton, { backgroundColor: accentColorValue }]}
          onPress={handleShare}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="share-outline" size={20} color="white" style={styles.shareIcon} />
              <Text style={styles.shareButtonText}>Share today's win</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)', // Dark overlay for the modal background
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 20,
    right: 20,
    zIndex: 10,
  },
  viewShotContainer: {
    width: WINDOW_WIDTH * 0.9, // Adjust preview size
    height: (WINDOW_WIDTH * 0.9) * (STORY_HEIGHT / STORY_WIDTH), // Maintain aspect ratio
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'white', // Fallback background
  },
  imageContent: {
    width: STORY_WIDTH,
    height: STORY_HEIGHT,
    transform: [{ scale: (WINDOW_WIDTH * 0.9) / STORY_WIDTH }], // Scale content to fit preview
    transformOrigin: 'top left',
  },
  gradientContainer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SAFE_MARGIN_TOP,
    paddingBottom: SAFE_MARGIN_BOTTOM,
    paddingHorizontal: SAFE_MARGIN_HORIZONTAL,
  },
  // Update the affirmationText
affirmationText: {
  fontSize: 30 * SCALE, // smaller than 42
  fontWeight: '300',
  textAlign: 'center',
  lineHeight: 36 * SCALE, // adjust line height
  letterSpacing: 0,
  flexWrap: 'wrap',
},

// Update brandingContainer
brandingContainer: {
  marginBottom: 20 * SCALE, // reduced from 40
  alignItems: 'center',
  flexShrink: 0, // ensures it doesn't get pushed out
},

// Optional: add scroll/flex for long quotes
safeContent: {
  flex: 1,
  width: '100%',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingBottom: 20 * SCALE, // add extra padding to keep handle visible
},
  affirmationContainer: { // quote
    marginTop: 30 * SCALE,
    marginBottom: 40 * SCALE,
    paddingHorizontal: 40 * SCALE,
    maxWidth: STORY_WIDTH * 0.75,
    width: '100%',
  },

  streakContainer: {
    alignItems: 'center',
    marginTop: -20 * SCALE, // Negative margin to bring it closer to the quote
  },
  streakNumber: {
    fontSize: 120 * SCALE,
    fontWeight: 'bold',
    lineHeight: 140 * SCALE,
  },
  streakLabel: { // day streak label
    fontSize: 20 * SCALE,
    fontWeight: '600',
    marginTop: 1 * SCALE,
    marginBottom: 10 * SCALE,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
 
  brandingText: { // ig handle
    fontSize: 20 * SCALE,
    marginTop: 50 * SCALE,
    fontWeight: '500',
    opacity: 0.8,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 200,
  },
  shareButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  shareIcon: {
    marginRight: 0,
  },
});

