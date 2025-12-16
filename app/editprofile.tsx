import { supabase } from '@/config/supabase';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EditProfileScreen() {
  const theme = useTheme();
  const auth = useAuth();
  
  // Defensive checks
  if (!theme || !auth) {
    return null; // or a loading component
  }
  
  const { colors, isDarkMode } = theme;
  const { user, userProfile, refreshUserProfile } = auth;
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    firstName: '',
  });

  useEffect(() => {
    if (userProfile) {
      setFirstName(userProfile.firstName || '');
      setEmail(userProfile.email || '');
    }
  }, [userProfile]);

  const validateFields = () => {
    const newErrors = {
      firstName: ''
    };
    let isValid = true;

    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
      isValid = false;
    } else if (firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSave = async () => {
    if (!validateFields() || !user) {
      return;
    }

    setLoading(true);
    try {
      // Update user document in Supabase
      const { error } = await supabase
        .from('users')
        .update({
          first_name: firstName.trim(),
          name: firstName.trim(),
        })
        .eq('id', user.id);

      if (error) throw error;

      // Refresh the user profile in context
      await refreshUserProfile();

      Alert.alert('Success', 'Profile updated successfully!');
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Profile</Text>
        <View style={styles.backButton} />
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          {/* First Name Input */}
          <View>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color={colors.secondary} style={styles.inputIcon} />
              <TextInput
                style={[
                  styles.input, 
                  { 
                    backgroundColor: colors.card,
                    color: colors.text,
                    borderColor: errors.firstName ? '#FF3B30' : colors.border,
                  }
                ]}
                placeholder="First Name"
                placeholderTextColor={colors.secondary}
                value={firstName}
                onChangeText={(text) => {
                  setFirstName(text);
                  if (errors.firstName) setErrors({...errors, firstName: ''});
                }}
                autoCapitalize="words"
              />
            </View>
            {errors.firstName ? (
              <Text style={styles.errorText}>{errors.firstName}</Text>
            ) : null}
          </View>

          {/* Email Display (Read-only) */}
          <View>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color={colors.secondary} style={styles.inputIcon} />
              <View style={[styles.readOnlyInput, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.readOnlyText, { color: colors.secondary }]}>{email || ''}</Text>
              </View>
            </View>
            <Text style={[styles.helpText, { color: colors.secondary }]}>
              Email cannot be changed
            </Text>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[
              styles.saveButton, 
              { 
                backgroundColor: loading ? colors.border : colors.primary,
                opacity: loading ? 0.7 : 1,
              }
            ]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  input: {
    flex: 1,
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 48,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  readOnlyInput: {
    flex: 1,
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 48,
    justifyContent: 'center',
    opacity: 0.6,
  },
  readOnlyText: {
    fontSize: 16,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginLeft: 16,
    marginTop: 4,
  },
  helpText: {
    fontSize: 12,
    marginLeft: 16,
    marginTop: -8,
  },
  saveButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});

