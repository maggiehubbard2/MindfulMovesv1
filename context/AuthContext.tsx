import { supabase } from '@/config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  firstName: string;
  dateOfBirth?: string; // ISO date string (YYYY-MM-DD)
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  /** True only after initial Supabase session hydration has completed. Never flips back to false. */
  authReady: boolean;
  /** Same as !authReady during startup; kept for backward compatibility. Do not use for navigation—use authReady. */
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, firstName: string, dateOfBirth?: Date) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  /** Re-fetch session from storage; only for app-resume flow after authReady. Avoids race with initial hydration. */
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  /** Stable flag: true only after the single initial getSession() has completed. Never set back to false. */
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[COLD_START] AuthProvider mounting...');
    return () => {
      console.log('[COLD_START] AuthProvider unmounting');
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      if (data) {
        const profile = {
          id: data.id,
          email: data.email,
          name: data.name,
          firstName: data.first_name,
          dateOfBirth: data.date_of_birth || undefined,
          created_at: data.created_at,
        };
        setUserProfile(profile);
        await AsyncStorage.setItem('userProfile', JSON.stringify(profile));
      }
    } catch (error) {
      // Silent error - will retry on next auth state change
      console.error('Error fetching user profile:', error);
    }
  };

  // Single source of truth: only place that calls getSession() for initial hydration.
  // No timeout—avoids race where we'd show "logged out" before storage has finished loading.
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      console.log('[COLD_START] AuthContext: Starting initialization');
      const initStartTime = Date.now();

      try {
        console.log('[COLD_START] AuthContext: Getting session + cached profile in parallel...');
        const [sessionResult, cachedProfile] = await Promise.all([
          supabase.auth.getSession(),
          AsyncStorage.getItem('userProfile').catch(() => null),
        ]);

        if (!mounted) {
          console.log('[COLD_START] AuthContext: Component unmounted during init');
          return;
        }

        const { data: { session }, error } = sessionResult;
        const initDuration = Date.now() - initStartTime;
        console.log(`[COLD_START] AuthContext: Session retrieved in ${initDuration}ms (has session: ${!!session})`);

        if (error) {
          console.error('[COLD_START] Error getting session:', error);
          setUser(null);
          setUserProfile(null);
          setLoading(false);
          setAuthReady(true);
          return;
        }

        if (session?.user) {
          setUser(session.user);
          if (cachedProfile) {
            try {
              setUserProfile(JSON.parse(cachedProfile));
            } catch (e) {
              // Invalid cache, fetch fresh
            }
          }
          console.log('[COLD_START] AuthContext: User set, fetching profile in background...');
          if (typeof requestIdleCallback !== 'undefined') {
            requestIdleCallback(() => {
              fetchUserProfile(session.user.id);
            });
          } else {
            setTimeout(() => {
              fetchUserProfile(session.user.id);
            }, 0);
          }
        } else {
          setUser(null);
          setUserProfile(null);
          console.log('[COLD_START] AuthContext: No session found');
        }
      } catch (error) {
        console.error('[COLD_START] Error initializing auth:', error);
        if (mounted) {
          setUser(null);
          setUserProfile(null);
        }
      } finally {
        if (mounted) {
          const totalDuration = Date.now() - initStartTime;
          console.log(`[COLD_START] AuthContext: authReady set (total init: ${totalDuration}ms)`);
          setLoading(false);
          setAuthReady(true);
        }
      }
    };

    initializeAuth();

    // Listener only updates user/profile. Does NOT set loading or authReady—prevents race where
    // listener fires before getSession() completes and would mark "ready" prematurely.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (session?.user) {
        setUser(session.user);
        await fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setUserProfile(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        // Provide more helpful error messages
        if (error.message?.includes('Email not confirmed') || error.message?.includes('email_not_confirmed')) {
          throw new Error('Please check your email and click the confirmation link before signing in.');
        }
        throw error;
      }
      
      // Explicitly set user state immediately after successful login
      // This ensures user state is available before navigation happens
      if (data.user && data.session) {
        setUser(data.user);
        
        // Fetch profile in background - don't block login completion
        // If it fails or hangs, login should still succeed
        // onAuthStateChange will also fire and fetch the profile,
        // ensuring it eventually gets loaded even if this call fails
        fetchUserProfile(data.user.id).catch((error) => {
          // Log but don't block - profile will be fetched by onAuthStateChange
          if (__DEV__) {
            console.error('Error fetching profile during login (non-blocking):', error);
          }
        });
      }
    } catch (error: any) {
      throw error;
    }
  };

  const signUp = async (email: string, password: string, firstName: string, dateOfBirth?: Date) => {
    try {
      // Validate inputs
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }
      
      if (!email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }
      
      // Format date of birth as ISO string (YYYY-MM-DD) if provided
      const dobString = dateOfBirth ? dateOfBirth.toISOString().split('T')[0] : null;
      
      // Sign up user with metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: firstName,
            first_name: firstName,
            date_of_birth: dobString,
          },
        },
      });
      
      if (authError) throw authError;
      
      if (!authData.user) {
        throw new Error('Failed to create user');
      }
      
      // Create user profile using a database function (bypasses RLS)
      // This is a fallback in case the trigger doesn't fire
      try {
        const { error: profileError } = await supabase.rpc('create_user_profile', {
          user_id: authData.user.id,
          user_email: email,
          user_name: firstName,
          user_first_name: firstName,
          user_date_of_birth: dobString || null,
        });
        
        if (profileError) {
          console.error('Error creating profile via RPC:', profileError);
          // Continue anyway - trigger might have created it
        }
      } catch (rpcError) {
        console.error('RPC call failed:', rpcError);
        // Continue anyway - trigger might have created it
      }
      
      // Wait a moment for profile creation to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Fetch the profile
      if (authData.user && authData.session) {
        // User is immediately logged in (email confirmation disabled)
        await fetchUserProfile(authData.user.id);
      } else if (authData.user) {
        // Email confirmation required - set profile from metadata temporarily
        setUserProfile({
          id: authData.user.id,
          email: authData.user.email || email,
          name: firstName,
          firstName: firstName,
          dateOfBirth: dobString || undefined,
          created_at: new Date().toISOString(),
        });
      }
    } catch (error: any) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Clear AsyncStorage data (user-specific cache)
      await AsyncStorage.multiRemove([
        'habits',
        'tasks',
        'lastHabitResetDate',
        'lastTaskCheck',
        'userProfile',
        // Note: Don't clear theme preferences - users might want to keep those
      ]);
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Explicitly clear local state immediately
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'mindfulmoves://reset-password',
      });
      if (error) throw error;
    } catch (error: any) {
      throw error;
    }
  };

  const refreshUserProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id);
    }
  };

  // For app-resume only: re-fetch session from storage after inactivity. Called only when authReady
  // so it never races with initial hydration.
  const refreshSession = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) return;
    if (session?.user) {
      setUser(session.user);
      await fetchUserProfile(session.user.id);
    } else {
      setUser(null);
      setUserProfile(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, authReady, loading, signIn, signUp, logout, resetPassword, refreshUserProfile, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
