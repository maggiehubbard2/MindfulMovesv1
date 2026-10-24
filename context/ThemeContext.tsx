import { supabase } from '@/config/supabase';
import { useAuth } from '@/context/AuthContext';
import { isDemoMode } from '@/utils/demoMode';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

type AccentColorKey = 'blue' | 'pink' | 'green' | 'purple' | 'custom';

export interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  colors: {
    background: string;
    card: string;
    text: string;
    border: string;
    primary: string;
    secondary: string;
  };
  accentColor: AccentColorKey;
  /** Accent stored for this user. May differ from accentColor during a session-only Pro fallback. */
  persistedAccentColor: AccentColorKey;
  customAccentColor: string;
  setAccentColor: (color: AccentColorKey, customColor?: string) => void;
  applyPersistedAccent: (color: string | undefined, customColor?: string) => void;
  /** Apply the account profile accent. A missing color stays on the default blue. */
  applyAccountAccent: (userId: string, color: string | undefined, customColor?: string) => void;
  /** User whose profile accent has been applied. Null until that profile is available. */
  accentResolvedForUserId: string | null;
  applySessionBlue: () => void;
  restorePersistedAccent: () => void;
}

const accentColors = {
  blue: {
    primary: '#007AFF',
    secondary: '#5856D6',
  },
  pink: {
    primary: '#ff2dbe',
    secondary: '#ff60ce',
  },
  green: {
    primary: '#34C759',
    secondary: '#30B350',
  },
  purple: {
    primary: '#AF52DE',
    secondary: '#9C4DCC',
  },
} satisfies Record<Exclude<AccentColorKey, 'custom'>, { primary: string; secondary: string }>;

const lightColors = {
  background: '#FFFFFF',
  card: '#F2F2F7',
  text: '#000000',
  border: '#C6C6C8',
};

const darkColors = {
  background: '#000000',
  card: '#1C1C1E',
  text: '#FFFFFF',
  border: '#38383A',
};

const ACCENT_COLOR_KEYS: AccentColorKey[] = ['blue', 'pink', 'green', 'purple', 'custom'];

function isAccentColorKey(value: string | undefined | null): value is AccentColorKey {
  return !!value && ACCENT_COLOR_KEYS.includes(value as AccentColorKey);
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function normalizeHex(hex: string) {
  if (!hex) return '#FF6B6B';
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
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const demoMode = isDemoMode();
  const { user } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [accentColor, setAccentColor] = useState<AccentColorKey>(demoMode ? 'purple' : 'blue');
  const [persistedAccentColor, setPersistedAccentColor] = useState<AccentColorKey>(
    demoMode ? 'purple' : 'blue'
  );
  const [customAccentColor, setCustomAccentColor] = useState<string>('#FF6B6B');
  const [accentResolvedForUserId, setAccentResolvedForUserId] = useState<string | null>(null);
  const [themeUserId, setThemeUserId] = useState<string | undefined>(user?.id);
  const sessionBlueRef = useRef(false);
  const persistedAccentRef = useRef<AccentColorKey>(demoMode ? 'purple' : 'blue');
  const customAccentRef = useRef(customAccentColor);
  const ignoreStaleProfileRef = useRef<AccentColorKey | null>(null);
  const userIdRef = useRef(user?.id);
  userIdRef.current = user?.id;

  // A new account must not inherit the previous account's accent, including a
  // custom color left in the device cache.
  if (user?.id !== themeUserId) {
    setThemeUserId(user?.id);
    setAccentResolvedForUserId(null);
    if (!demoMode) {
      persistedAccentRef.current = 'blue';
      sessionBlueRef.current = false;
      ignoreStaleProfileRef.current = null;
      setPersistedAccentColor('blue');
      setAccentColor('blue');
    }
  }

  useEffect(() => {
    customAccentRef.current = customAccentColor;
  }, [customAccentColor]);

  useEffect(() => {
    console.log('[COLD_START] ThemeProvider mounting...');
    if (demoMode) {
      setIsDarkMode(false);
      setAccentColor('purple');
    } else {
      loadThemePreference();
    }
    return () => {
      console.log('[COLD_START] ThemeProvider unmounting');
    };
  }, [demoMode]);

  const loadThemePreference = async () => {
    try {
      console.log('[COLD_START] ThemeContext: Loading preferences from AsyncStorage...');
      const startTime = Date.now();
      const darkModeValue = await AsyncStorage.getItem('darkMode');
      const duration = Date.now() - startTime;
      console.log(`[COLD_START] ThemeContext: Preferences loaded in ${duration}ms`);

      if (darkModeValue !== null) {
        setIsDarkMode(JSON.parse(darkModeValue));
      }
    } catch (error) {
      console.error('[COLD_START] Error loading theme preference:', error);
    }
  };

  const toggleDarkMode = async () => {
    try {
      const newDarkMode = !isDarkMode;
      setIsDarkMode(newDarkMode);
      if (isDemoMode()) return;
      await AsyncStorage.setItem('darkMode', JSON.stringify(newDarkMode));
    } catch (error) {
      console.error('Error saving dark mode preference:', error);
    }
  };

  const lightenColor = (hex: string, amount = 0.25) => {
    const normalized = normalizeHex(hex);
    const bigint = parseInt(normalized.slice(1), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    const adjust = (channel: number) =>
      Math.min(255, Math.round(channel + (255 - channel) * amount));

    const newR = adjust(r);
    const newG = adjust(g);
    const newB = adjust(b);

    return (
      '#' +
      [newR, newG, newB]
        .map((channel) => channel.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase()
    );
  };

  const cacheAccent = useCallback(async (color: AccentColorKey, customHex?: string) => {
    const userId = userIdRef.current;
    if (!userId) return;
    await AsyncStorage.setItem(`accentColor:${userId}`, color);
    if (customHex) {
      await AsyncStorage.setItem(`customAccentColor:${userId}`, customHex);
    }
  }, []);

  const rememberPersistedAccent = useCallback((color: AccentColorKey, customHex?: string) => {
    persistedAccentRef.current = color;
    setPersistedAccentColor(color);
    if (customHex) {
      customAccentRef.current = customHex;
      setCustomAccentColor(customHex);
    }
  }, []);

  const applyPersistedAccent = useCallback(
    (color: string | undefined, customColor?: string) => {
      if (isDemoMode() || !isAccentColorKey(color)) return;
      if (ignoreStaleProfileRef.current && ignoreStaleProfileRef.current !== color) return;
      if (ignoreStaleProfileRef.current === color) {
        ignoreStaleProfileRef.current = null;
      }

      const customHex = customColor ? normalizeHex(customColor) : undefined;
      rememberPersistedAccent(color, customHex);
      if (color !== 'custom') {
        sessionBlueRef.current = false;
      }
      if (!sessionBlueRef.current || color !== 'custom') {
        setAccentColor(color);
      }
      cacheAccent(color, customHex).catch((error) => {
        console.error('Error caching accent color from profile:', error);
      });
    },
    [cacheAccent, rememberPersistedAccent]
  );

  const applyAccountAccent = useCallback(
    (userId: string, color: string | undefined, customColor?: string) => {
      if (isDemoMode() || userIdRef.current !== userId) return;
      const next = isAccentColorKey(color) ? color : 'blue';
      applyPersistedAccent(next, next === 'custom' ? customColor : undefined);
      setAccentResolvedForUserId(userId);
    },
    [applyPersistedAccent]
  );

  const applySessionBlue = useCallback(() => {
    if (isDemoMode() || persistedAccentRef.current !== 'custom') return;
    sessionBlueRef.current = true;
    setAccentColor('blue');
  }, []);

  const restorePersistedAccent = useCallback(() => {
    if (isDemoMode()) return;
    sessionBlueRef.current = false;
    setAccentColor(persistedAccentRef.current);
  }, []);

  const handleSetAccentColor = async (color: AccentColorKey, customColor?: string) => {
    try {
      sessionBlueRef.current = false;
      ignoreStaleProfileRef.current = color;

      let customHex: string | undefined;
      if (color === 'custom') {
        customHex = normalizeHex(customColor || customAccentRef.current);
      }

      rememberPersistedAccent(color, customHex);
      setAccentColor(color);
      if (isDemoMode()) return;

      await cacheAccent(color, customHex);

      const userId = userIdRef.current;
      if (!userId) return;

      const update: { accent_color: AccentColorKey; custom_accent_color?: string } = {
        accent_color: color,
      };
      if (color === 'custom' && customHex) {
        update.custom_accent_color = customHex;
      }

      const { error } = await supabase.from('users').update(update).eq('id', userId);
      if (error) {
        console.error('Error saving accent color to profile:', error);
      }
    } catch (error) {
      console.error('Error saving accent color preference:', error);
    }
  };

  const accentPalette =
    accentColor === 'custom'
      ? {
          primary: normalizeHex(customAccentColor),
          secondary: lightenColor(customAccentColor),
        }
      : accentColors[accentColor];

  const colors = {
    ...(isDarkMode ? darkColors : lightColors),
    ...accentPalette,
  };

  return (
    <ThemeContext.Provider
      value={{
        isDarkMode,
        toggleDarkMode,
        colors,
        accentColor,
        persistedAccentColor,
        customAccentColor,
        setAccentColor: handleSetAccentColor,
        applyPersistedAccent,
        applyAccountAccent,
        accentResolvedForUserId,
        applySessionBlue,
        restorePersistedAccent,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/** Apply the account accent from the loaded profile. No saved color means blue. */
export function useSyncAccentFromProfile() {
  const { user, userProfile } = useAuth();
  const { applyAccountAccent } = useTheme();

  useEffect(() => {
    if (isDemoMode()) return;
    if (!user?.id || !userProfile || userProfile.id !== user.id) return;
    applyAccountAccent(user.id, userProfile.accentColor, userProfile.customAccentColor);
  }, [
    applyAccountAccent,
    user?.id,
    userProfile,
  ]);
} 