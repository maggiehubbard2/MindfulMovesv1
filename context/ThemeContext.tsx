import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

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
  customAccentColor: string;
  setAccentColor: (color: AccentColorKey, customColor?: string) => void;
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

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [accentColor, setAccentColor] = useState<AccentColorKey>('blue');
  const [customAccentColor, setCustomAccentColor] = useState<string>('#FF6B6B');

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const darkModeValue = await AsyncStorage.getItem('darkMode');
      const accentColorValue = await AsyncStorage.getItem('accentColor');
      const customAccentColorValue = await AsyncStorage.getItem('customAccentColor');
      if (darkModeValue !== null) {
        setIsDarkMode(JSON.parse(darkModeValue));
      }
      if (accentColorValue !== null) {
        setAccentColor(accentColorValue as AccentColorKey);
      }
      if (customAccentColorValue) {
        setCustomAccentColor(customAccentColorValue);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  const toggleDarkMode = async () => {
    try {
      const newDarkMode = !isDarkMode;
      setIsDarkMode(newDarkMode);
      await AsyncStorage.setItem('darkMode', JSON.stringify(newDarkMode));
    } catch (error) {
      console.error('Error saving dark mode preference:', error);
    }
  };

  const normalizeHex = (hex: string) => {
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

  const handleSetAccentColor = async (color: AccentColorKey, customColor?: string) => {
    try {
      if (color === 'custom') {
        const normalizedCustom = normalizeHex(customColor || customAccentColor);
        setCustomAccentColor(normalizedCustom);
        await AsyncStorage.setItem('customAccentColor', normalizedCustom);
      }
      setAccentColor(color);
      await AsyncStorage.setItem('accentColor', color);
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
        customAccentColor,
        setAccentColor: handleSetAccentColor,
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