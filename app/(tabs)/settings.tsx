import ReminderSettings from '@/components/ReminderSettings';
import { isFreeAccentColor } from '@/config/subscription';
import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { useTheme } from '@/context/ThemeContext';
import { isDemoMode, requestStreakPreview } from '@/utils/demoMode';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const presetPalette = [
  '#FF3B30',
  '#FF9500',
  '#FFCC00',
  '#34C759',
  '#30B0C7',
  '#007AFF',
  '#5856D6',
  '#AF52DE',
  '#BF5AF2',
  '#FF2D55',
  '#FF9F0A',
  '#FFD60A',
  '#64D2FF',
  '#5E5CE6',
  '#D55F5C',
  '#9AC85D',
];

const normalizeHex = (hex: string) => {
  let value = hex.trim();
  if (!value.startsWith('#')) {
    value = `#${value}`;
  }
  if (value.length === 4) {
    value =
      '#' +
      value
        .slice(1)
        .split('')
        .map((char) => char + char)
        .join('');
  }
  return value.slice(0, 7).toUpperCase();
};

export default function SettingsScreen() {
  const { isDarkMode, toggleDarkMode, colors, accentColor, setAccentColor, customAccentColor } = useTheme();
  const { user, userProfile, logout, deleteUserInfo } = useAuth();
  const {
    isPro,
    isLoading: isSubscriptionLoading,
    presentPaywall,
    presentPaywallIfNeeded,
    presentCustomerCenter,
    restorePurchases,
  } = useSubscription();
  const isAdmin = userProfile?.isAdmin === true;
  const isPremium = userProfile?.isPremium === true;
  const hasUnlimitedColors = isPro || isAdmin || isPremium || isDemoMode();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const { openSubscription } = useLocalSearchParams<{ openSubscription?: string | string[] }>();
  const openSubscriptionParam = Array.isArray(openSubscription) ? openSubscription[0] : openSubscription;
  const pendingSubscriptionAction = useRef<(() => void) | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [tempCustomColor, setTempCustomColor] = useState(customAccentColor);
  const [hexInput, setHexInput] = useState(customAccentColor);

  useEffect(() => {
    if (openSubscriptionParam !== '1') return;
    setShowSubscriptionModal(true);
    router.setParams({ openSubscription: '' });
  }, [openSubscriptionParam]);


  const confirmLogout = async () => {
    try {
      setShowLogoutModal(false); // Close modal first for better UX
      await logout();
      // Don't navigate manually - let index.tsx handle it based on user state
      // This avoids race conditions and ensures auth state has propagated
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to logout');
      // Reopen modal if logout failed
      setShowLogoutModal(true);
    }
  };

    const confirmDeleteAccount
     = async () => {
      console.log('User confirmed account deletion');
    try {
      setShowDeleteAccountModal(false); // Close modal first for better UX
      console.log('Calling deleteUserInfo function');
      await deleteUserInfo(); // Assuming you have a deleteUserInfo function
      // Don't navigate manually - let index.tsx handle it based on user state
      // This avoids race conditions and ensures auth state has propagated
    } catch (error: any) {
      console.error('Error deleting account:', error);
      Alert.alert('Error', error?.message || 'Failed to delete account');
      // Reopen modal if deletion failed
      setShowDeleteAccountModal(true);
    }
  };


  const handleDeleteAccount = () => {
    setShowDeleteAccountModal(true);
  };
 
   const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const subscriptionStatusLabel = isSubscriptionLoading
    ? 'Checking status…'
    : isPro
      ? 'Mindful Moves Pro'
      : 'Free plan';

  const runPendingSubscriptionAction = () => {
    const action = pendingSubscriptionAction.current;
    pendingSubscriptionAction.current = null;
    action?.();
  };

  const queueSubscriptionAction = (action: () => void) => {
    pendingSubscriptionAction.current = action;
    setShowSubscriptionModal(false);
    if (Platform.OS !== 'ios') {
      setTimeout(runPendingSubscriptionAction, 350);
    }
  };
  
  const accentColorOptions = [
    { name: 'Blue', value: 'blue', color: '#007AFF' },
    { name: 'Pink', value: 'pink', color: '#ff60ce' },
    { name: 'Green', value: 'green', color: '#34C759' },
    { name: 'Purple', value: 'purple', color: '#AF52DE' },
    {
      name: 'Custom',
      value: 'custom',
      color: customAccentColor,
      isCustom: true,
    },
  ];

  const handleOpenColorPicker = async () => {
    if (!hasUnlimitedColors) {
      const unlocked = await presentPaywallIfNeeded();
      if (!unlocked) return;
    }
    setTempCustomColor(customAccentColor);
    setHexInput(customAccentColor);
    setShowColorPicker(true);
  };

  const handleSelectAccentOption = async (value: string) => {
    if (value === 'custom') {
      await handleOpenColorPicker();
      return;
    }

    if (!hasUnlimitedColors && !isFreeAccentColor(value)) {
      const unlocked = await presentPaywallIfNeeded();
      if (!unlocked) return;
    }

    setAccentColor(value as any);
  };

  const handleSelectPreset = (color: string) => {
    const normalized = normalizeHex(color);
    setTempCustomColor(normalized);
    setHexInput(normalized);
  };

  const isValidHex = useMemo(() => /^#([0-9A-F]{6})$/i.test(hexInput.trim()), [hexInput]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
      </View>
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Display Settings</Text>
          
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
              {accentColorOptions.map((option) => {
                const isActive = accentColor === option.value;
                const isLocked = !hasUnlimitedColors && !isFreeAccentColor(option.value);
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.colorOption,
                      { borderColor: isActive ? colors.primary : colors.border },
                    ]}
                    onPress={() => {
                      void handleSelectAccentOption(option.value);
                    }}
                  >
                    {option.isCustom ? (
                      <View style={styles.customSwatchOuter}>
                        <LinearGradient
                          colors={[
                            '#FF3B30',
                            '#FF9500',
                            '#FFCC00',
                            '#34C759',
                            '#30B0C7',
                            '#007AFF',
                            '#AF52DE',
                            '#FF2D55',
                            '#FF3B30',
                          ]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.colorWheelRing}
                        />
                        <View
                          style={[
                            styles.customSwatchInner,
                            { backgroundColor: option.color },
                          ]}
                        />
                        {isActive && (
                          <View style={styles.customCheckBadge}>
                            <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                          </View>
                        )}
                        {isLocked && (
                          <View style={styles.customCheckBadge}>
                            <Ionicons name="lock-closed" size={12} color="#FFFFFF" />
                          </View>
                        )}
                      </View>
                    ) : (
                      <View
                      style={[
                        styles.presetSwatchInner,
                        { backgroundColor: option.color },
                      ]}
                      >
                        {isActive && (
                          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                        )}
                        {isLocked && !isActive && (
                          <Ionicons name="lock-closed" size={12} color="#FFFFFF" />
                        )}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        <ReminderSettings />

        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: colors.card }]}
            onPress={() => setShowSubscriptionModal(true)}
          >
            <View style={styles.settingInfo}>
              <Ionicons
                name={isPro ? 'diamond' : 'diamond-outline'}
                size={24}
                color={colors.primary}
              />
              <View style={styles.userInfo}>
                <Text style={[styles.settingText, { color: colors.text }]}>Subscription</Text>
                <Text style={[styles.userEmail, { color: colors.secondary }]}>
                  {subscriptionStatusLabel}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.secondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>
          <TouchableOpacity 
            style={[styles.settingItem, { backgroundColor: colors.card }]}
            onPress={() => router.push('/editprofile')}
          >
            <View style={styles.settingInfo}>
              <Ionicons name="person-outline" size={24} color={colors.text} />
              <View style={styles.userInfo}>
                <Text style={[styles.settingText, { color: colors.text }]}>
                  {userProfile?.firstName || user?.email || 'User'}
                </Text>
                <Text style={[styles.userEmail, { color: colors.secondary }]}>{user?.email}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.secondary} />
          </TouchableOpacity>
        
       {/* Logout button */}
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: '#5e5d5d' }]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="white" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>

        {/* Delete Account button */}
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: '#FF3B30' }]}
            onPress={handleDeleteAccount}
          >
            <Ionicons name="skull-outline" size={20} color="white" />
            <Text style={styles.logoutText}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
          <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
            <View style={styles.settingInfo}>
              <Ionicons name="information-circle-outline" size={24} color={colors.text} />
              <Text style={[styles.settingText, { color: colors.text }]}>Version</Text>
            </View>
            <Text style={[styles.settingValue, { color: colors.text }]}>
              {Constants.expoConfig?.version ?? ''}
            </Text>
          </View>
        </View>

        {isDemoMode() && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Screenshots</Text>
            <TouchableOpacity
              style={[styles.settingItem, { backgroundColor: colors.card }]}
              onPress={() => {
                requestStreakPreview();
                router.push('/(tabs)/dashboard');
              }}
            >
              <View style={styles.settingInfo}>
                <Ionicons name="flame-outline" size={24} color={colors.primary} />
                <View style={styles.userInfo}>
                  <Text style={[styles.settingText, { color: colors.text }]}>Preview streak card</Text>
                  <Text style={[styles.userEmail, { color: colors.secondary }]}>
                    Opens the share screen without checking every habit
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.secondary} />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* HEX Code Color Picker Modal */}
      <Modal
        visible={showColorPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowColorPicker(false)}
      >
        <View style={styles.modalOverlay} pointerEvents="box-none">
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setShowColorPicker(false)}
            style={StyleSheet.absoluteFill}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'position' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? -100 : 20}
            style={{ width: '100%', alignItems: 'center' }}
            pointerEvents="box-none"
          >
            <View style={[styles.colorPickerContent, { backgroundColor: colors.card }]}>
              <Ionicons name="color-palette-outline" size={40} color={colors.primary} style={styles.modalIcon} />
              <Text style={[styles.modalTitle, { color: colors.text }]}>Choose Accent Color</Text>
              <Text style={[styles.modalMessage, { color: colors.secondary }]}>
                Tap a color below or enter a custom HEX value.
              </Text>

              <View style={styles.presetGrid}>
                {presetPalette.map((paletteColor) => {
                  const normalized = normalizeHex(paletteColor);
                  const isSelected = tempCustomColor === normalized;
                  return (
                    <TouchableOpacity
                      key={normalized}
                      style={[
                        styles.presetSwatch,
                        { backgroundColor: normalized },
                        isSelected && styles.selectedPreset,
                      ]}
                      onPress={() => handleSelectPreset(normalized)}
                    >
                      {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={[styles.hexInputContainer, { borderColor: colors.border }]}>
                <Text style={[styles.hexLabel, { color: colors.secondary }]}>HEX</Text>
                <TextInput
                  value={hexInput}
                  onChangeText={(text) => {
                    const formatted = text.startsWith('#') ? text.toUpperCase() : `#${text.toUpperCase()}`;
                    setHexInput(formatted);
                    if (/^#([0-9A-F]{3})$/i.test(formatted) || /^#([0-9A-F]{6})$/i.test(formatted)) {
                      setTempCustomColor(normalizeHex(formatted));
                    }
                  }}
                  style={[styles.hexInput, { color: colors.text }]}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={7}
                  placeholder="#FF6B6B"
                  placeholderTextColor={colors.secondary}
                />
                <View style={[styles.hexPreview, { backgroundColor: tempCustomColor }]} />
              </View>
              {!isValidHex && (
                <Text style={styles.validationText}>Enter a valid 6-digit HEX code (e.g., #FF6B6B).</Text>
              )}

              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.border }]}
                  onPress={() => setShowColorPicker(false)}
                >
                  <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    {
                      backgroundColor: tempCustomColor,
                      opacity: isValidHex ? 1 : 0.5,
                    },
                  ]}
                  onPress={() => {
                    if (isValidHex) {
                      setAccentColor('custom', tempCustomColor);
                      setShowColorPicker(false);
                    }
                  }}
                  disabled={!isValidHex}
                >
                  <Text style={styles.modalButtonText}>Use Color</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
      <Modal
        visible={showSubscriptionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSubscriptionModal(false)}
        onDismiss={runPendingSubscriptionAction}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setShowSubscriptionModal(false)}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.modalContent, styles.subscriptionModal, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Subscription</Text>
            <View style={[styles.settingItem, styles.subscriptionModalItem, { backgroundColor: colors.background }]}>
              <View style={styles.settingInfo}>
                <Ionicons
                  name={isPro ? 'diamond' : 'diamond-outline'}
                  size={24}
                  color={colors.primary}
                />
                <View style={styles.userInfo}>
                  <Text style={[styles.settingText, { color: colors.text }]}>{subscriptionStatusLabel}</Text>
                  <Text style={[styles.userEmail, { color: colors.secondary }]}>
                    {isPro ? 'Full access unlocked' : 'Upgrade for the full experience'}
                  </Text>
                </View>
              </View>
            </View>

            {!isPro && (
              <TouchableOpacity
                style={[styles.settingItem, styles.subscriptionModalItem, { backgroundColor: colors.background }]}
                onPress={() => queueSubscriptionAction(() => void presentPaywall())}
              >
                <View style={styles.settingInfo}>
                  <Ionicons name="sparkles-outline" size={24} color={colors.primary} />
                  <Text style={[styles.settingText, { color: colors.text }]}>Upgrade to Pro</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.secondary} />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.settingItem, styles.subscriptionModalItem, { backgroundColor: colors.background }]}
              onPress={() => queueSubscriptionAction(() => void presentCustomerCenter())}
            >
              <View style={styles.settingInfo}>
                <Ionicons name="card-outline" size={24} color={colors.text} />
                <Text style={[styles.settingText, { color: colors.text }]}>Manage subscription</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.secondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingItem, styles.subscriptionModalItem, { backgroundColor: colors.background }]}
              onPress={() => queueSubscriptionAction(() => void restorePurchases())}
            >
              <View style={styles.settingInfo}>
                <Ionicons name="refresh-outline" size={24} color={colors.text} />
                <Text style={[styles.settingText, { color: colors.text }]}>Restore purchases</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.secondary} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

{/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Ionicons name="log-out-outline" size={48} color="#FF3B30" style={styles.modalIcon} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>Logout</Text>
            <Text style={[styles.modalMessage, { color: colors.secondary }]}>
              Are you sure you want to logout?
            </Text>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.border }]}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#FF3B30' }]}
                onPress={confirmLogout}
              >
                <Text style={styles.modalButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Account Confirmation Modal */}
      <Modal
        visible={showDeleteAccountModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteAccountModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Ionicons name="log-out-outline" size={48} color="#FF3B30" style={styles.modalIcon} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>Delete Account</Text>
            <Text style={[styles.modalMessage, { color: colors.secondary }]}>
              Are you sure you want to delete your account and all related data? This cannot be undone.
            </Text>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.border }]}
                onPress={() => setShowDeleteAccountModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#FF3B30' }]}
                onPress={confirmDeleteAccount}
              >
                <Text style={styles.modalButtonText}>Delete Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  scrollView: {
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
  settingText: {
    fontSize: 16,
    marginLeft: 12,
  },
  settingValue: {
    fontSize: 16,
    opacity: 0.7,
  },
  userInfo: {
    marginLeft: 12,
  },
  userEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  colorOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  presetSwatchInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customSwatchOuter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customSwatchInner: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  colorWheelRing: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#FF2D55',
    opacity: 0.8,
  },
  customCheckBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    backgroundColor: '#00000080',
    borderRadius: 12,
    padding: 4,
  },
  colorPickerContent: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  presetSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedPreset: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  hexInputContainer: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hexLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  hexInput: {
    flex: 1,
    fontSize: 16,
  },
  hexPreview: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  validationText: {
    fontSize: 12,
    color: '#FF3B30',
    alignSelf: 'flex-start',
    paddingHorizontal: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  subscriptionModal: {
    alignItems: 'stretch',
  },
  subscriptionModalItem: {
    marginBottom: 8,
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  timeDisplay: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  timePickerModal: {
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  timePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
