import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

type AccentColor = 'blue' | 'pink' | 'green' | 'purple';

interface ThemeContextType {
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
  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => void;
}

const accentColors = {
  blue: {
    primary: '#007AFF',
    secondary: '#5856D6',
  },
  pink: {
    primary: '#FF2D55',
    secondary: '#FF375F',
  },
  green: {
    primary: '#34C759',
    secondary: '#30B350',
  },
  purple: {
    primary: '#AF52DE',
    secondary: '#9C4DCC',
  },
};

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
  const [accentColor, setAccentColor] = useState<AccentColor>('blue');

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const darkModeValue = await AsyncStorage.getItem('darkMode');
      const accentColorValue = await AsyncStorage.getItem('accentColor');
      if (darkModeValue !== null) {
        setIsDarkMode(JSON.parse(darkModeValue));
      }
      if (accentColorValue !== null) {
        setAccentColor(accentColorValue as AccentColor);
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

  const handleSetAccentColor = async (color: AccentColor) => {
    try {
      setAccentColor(color);
      await AsyncStorage.setItem('accentColor', color);
    } catch (error) {
      console.error('Error saving accent color preference:', error);
    }
  };

  const colors = {
    ...(isDarkMode ? darkColors : lightColors),
    ...accentColors[accentColor],
  };

  return (
    <ThemeContext.Provider
      value={{
        isDarkMode,
        toggleDarkMode,
        colors,
        accentColor,
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