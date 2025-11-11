import Quote from '@/components/Quote';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { getRandomQuote } from '@/utils/quoteUtils';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const { colors } = useTheme();
  const { signIn, signUp, resetPassword, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showEmailExistsModal, setShowEmailExistsModal] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    firstName: ''
  });
  const loadingQuote = useMemo(() => getRandomQuote(), []);

  const validateFields = () => {
    const newErrors = {
      email: '',
      password: '',
      firstName: ''
    };
    let isValid = true;

    // Email validation
    if (!email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!email.includes('@') || !email.includes('.')) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    // Password validation
    if (!password.trim()) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    // Sign up specific validations
    if (isSignUp) {
      if (!firstName.trim()) {
        newErrors.firstName = 'First name is required';
        isValid = false;
      } else if (firstName.trim().length < 2) {
        newErrors.firstName = 'First name must be at least 2 characters';
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleForgotPassword = async () => {
    const emailToReset = resetEmail || email;
    
    if (!emailToReset.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!emailToReset.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      await resetPassword(emailToReset);
      setShowForgotPasswordModal(false);
      Alert.alert(
        'Email Sent!',
        'A password reset link has been sent to your email. Please check your inbox.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      let errorMessage = 'Failed to send reset email';
      if (error?.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (error?.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      }
      Alert.alert('Error', errorMessage);
    }
  };

  const handleAuth = async () => {
    // Validate all fields
    if (!validateFields()) {
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password, firstName);
        Alert.alert('Success', 'Account created successfully!');
        router.replace('/(tabs)/dashboard');
      } else {
        await signIn(email, password);
        console.log('signIn successful'); 
        router.replace('/(tabs)/dashboard');
      }
    } catch (error: any) {
      // Handle specific Firebase errors
      let errorMessage = 'Authentication failed';
      if (error?.code === 'auth/email-already-in-use') {
        setShowEmailExistsModal(true);
        return; // Exit early since we handled this specific error
      } else if (error?.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error?.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use a stronger password.';
      } else if (error?.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email. Please sign up first.';
      } else if (error?.code === 'auth/wrong-password' || error?.code === 'auth/invalid-credential') {
        errorMessage = 'Incorrect password. Please check your password and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.loadingContent}>
          <Quote text={loadingQuote.text} author={loadingQuote.author} />
          <View style={styles.loadingIndicator}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.secondary }]}>
              Getting things ready...
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Mindful Moves</Text>
            <Text style={[styles.subtitle, { color: colors.secondary }]}>
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {isSignUp && (
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
                    autoCorrect={false}
                  />
                </View>
                {errors.firstName ? (
                  <Text style={styles.errorText}>{errors.firstName}</Text>
                ) : null}
              </View>
            )}

            <View>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color={colors.secondary} style={styles.inputIcon} />
                <TextInput
                  style={[
                    styles.input, 
                    { 
                      backgroundColor: colors.card,
                      color: colors.text,
                      borderColor: errors.email ? '#FF3B30' : colors.border,
                    }
                  ]}
                  placeholder="Email"
                  placeholderTextColor={colors.secondary}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) setErrors({...errors, email: ''});
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {errors.email ? (
                <Text style={styles.errorText}>{errors.email}</Text>
              ) : null}
            </View>


            <View>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.secondary} style={styles.inputIcon} />
                <TextInput
                  style={[
                    styles.input, 
                    { 
                      backgroundColor: colors.card,
                      color: colors.text,
                      borderColor: errors.password ? '#FF3B30' : colors.border,
                    }
                  ]}
                  placeholder="Password (min 6 characters)"
                  placeholderTextColor={colors.secondary}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) setErrors({...errors, password: ''});
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color={colors.secondary} 
                  />
                </TouchableOpacity>
              </View>
              {errors.password ? (
                <Text style={styles.errorText}>{errors.password}</Text>
              ) : null}
            </View>

            {!isSignUp && (
              <TouchableOpacity
                style={styles.forgotPasswordLink}
                onPress={() => {
                  setResetEmail(email);
                  setShowForgotPasswordModal(true);
                }}
              >
                <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.authButton, 
                { 
                  backgroundColor: loading ? colors.border : colors.primary,
                  opacity: loading ? 0.7 : 1,
                }
              ]}
              onPress={handleAuth}
              disabled={loading}
            >
              <Text style={styles.authButtonText}>
                {loading ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Sign In')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => setIsSignUp(!isSignUp)}
            >
              <Text style={[styles.switchText, { color: colors.primary }]}>
                {isSignUp 
                  ? 'Already have an account? Sign In' 
                  : "Don't have an account? Sign Up"
                }
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.secondary }]}>
              Track your tasks, build better routines
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Custom Modal for Email Already Exists */}
      <Modal
        visible={showEmailExistsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEmailExistsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Ionicons name="warning-outline" size={48} color="#FF9500" style={styles.modalIcon} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>Account Already Exists</Text>
            <Text style={[styles.modalMessage, { color: colors.secondary }]}>
              An account with this email already exists. Please try signing in instead.
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                setShowEmailExistsModal(false);
                setIsSignUp(false);
              }}
            >
              <Text style={styles.modalButtonText}>OK, Switch to Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Forgot Password Modal */}
      <Modal
        visible={showForgotPasswordModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowForgotPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Ionicons name="mail-outline" size={48} color={colors.primary} style={styles.modalIcon} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>Reset Password</Text>
            <Text style={[styles.modalMessage, { color: colors.secondary }]}>
              Enter your email address and we'll send you a link to reset your password.
            </Text>
            <View style={styles.modalInputContainer}>
              <TextInput
                style={[styles.modalInput, { 
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border,
                }]}
                placeholder="Email"
                placeholderTextColor={colors.secondary}
                value={resetEmail}
                onChangeText={setResetEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.border }]}
                onPress={() => setShowForgotPasswordModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleForgotPassword}
              >
                <Text style={styles.modalButtonText}>Send Reset Link</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingContent: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    gap: 24,
  },
  loadingIndicator: {
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    position: 'relative',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginLeft: 16,
    marginBottom: 12,
    marginTop: 4,
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  passwordToggle: {
    position: 'absolute',
    right: 16,
    zIndex: 1,
    padding: 8,
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
  authButton: {
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
  authButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  switchButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  switchText: {
    fontSize: 16,
    fontWeight: '500',
  },
  forgotPasswordLink: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
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
  modalButton: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalInputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  modalInput: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
});
