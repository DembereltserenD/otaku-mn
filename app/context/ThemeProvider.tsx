import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useNativeColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PropsWithChildren } from 'react';

// Define our theme colors
export const lightTheme = {
  // Deku-inspired color scheme with light mode variants (happy school version)
  primary: '#1A7852', // Emerald Green - Deku's jumpsuit
  primaryLight: '#2C9A6D', // Lighter green for hover states
  primaryDark: '#116141', // Darker green for pressed states
  secondary: '#E63946', // Bright Red - Deku's shoes and energy effects
  secondaryLight: '#F05D69', // Lighter red for hover states
  secondaryDark: '#C42836', // Darker red for pressed states
  background: '#E8F3FF', // Light blue background - UA High School colors
  text: '#1A365D', // Dark blue-gray - Deku's hair color
  textSecondary: '#4A5568', // Secondary text - slightly lighter blue-gray
  border: '#E5E7EB', // Light border
  success: '#10B981', // Green
  error: '#EF4444', // Red
  warning: '#F59E0B', // Amber
  info: '#3B82F6', // Blue
  card: '#FFFFFF', // Card background
  cardHover: '#F3F4F6', // Card hover state
  inactive: '#9CA3AF', // Inactive state
  skeleton: '#E5E7EB', // Skeleton loading state
  overlay: 'rgba(0, 0, 0, 0.5)', // Modal overlay
};

export const darkTheme = {
  // Deku-inspired color scheme (depressed version)
  primary: '#2C9A6D', // Slightly lighter green for dark mode
  primaryLight: '#3DAC7F', // Even lighter green for hover states
  primaryDark: '#1A7852', // Original green for pressed states
  secondary: '#F05D69', // Slightly lighter red for dark mode
  secondaryLight: '#F47F89', // Even lighter red for hover states
  secondaryDark: '#E63946', // Original red for pressed states
  background: '#1E293B', // Darker blue-gray background - representing Deku's melancholic state
  text: '#F9FAFB', // Light text for dark mode
  textSecondary: '#D1D5DB', // Secondary text
  border: '#374151', // Dark border
  success: '#34D399', // Lighter green for dark mode
  error: '#F87171', // Lighter red for dark mode
  warning: '#FBBF24', // Lighter amber for dark mode
  info: '#60A5FA', // Lighter blue for dark mode
  card: '#0F172A', // Darker card background
  cardHover: '#374151', // Card hover state
  inactive: '#6B7280', // Inactive state
  skeleton: '#374151', // Skeleton loading state
  overlay: 'rgba(0, 0, 0, 0.75)', // Modal overlay
};

// Black theme for admin section
export const blackTheme = {
  primary: '#3DAC7F', // Brighter green for better contrast on black
  primaryLight: '#4FBE91', // Even lighter green for hover states
  primaryDark: '#2C9A6D', // Darker green for pressed states
  secondary: '#F47F89', // Brighter red for better contrast
  secondaryLight: '#F8A1A9', // Even lighter red for hover states
  secondaryDark: '#F05D69', // Darker red for pressed states
  background: '#000000', // Pure black background for admin
  text: '#FFFFFF', // White text for maximum contrast
  textSecondary: '#E2E8F0', // Very light gray for secondary text
  border: '#2D3748', // Dark border with slight visibility
  success: '#4ADE80', // Bright green for success states
  error: '#FB7185', // Bright red for error states
  warning: '#FCD34D', // Bright yellow for warning states
  info: '#7DD3FC', // Bright blue for info states
  card: '#111827', // Very dark card background
  cardHover: '#1F2937', // Slightly lighter for hover states
  inactive: '#6B7280', // Medium gray for inactive states
  skeleton: '#1F2937', // Dark loading skeleton
  overlay: 'rgba(0, 0, 0, 0.9)', // Nearly opaque overlay
};

type ThemeColors = typeof lightTheme;

export type ThemeMode = 'light' | 'dark' | 'black';

type ThemeContextType = {
  themeMode: ThemeMode;
  isDarkMode: boolean;
  isAdminMode: boolean;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  colors: ThemeColors;
};

const ThemeContext = createContext<ThemeContextType>({
  themeMode: 'dark',
  isDarkMode: true,
  isAdminMode: false,
  toggleTheme: () => { },
  setThemeMode: () => { },
  colors: darkTheme,
});

const THEME_STORAGE_KEY = 'otaku_mn_theme_mode';

/**
 * ThemeProvider component that provides theme context for the application
 * Manages theme modes (light/dark/black) and provides methods to toggle and set themes
 */
export function ThemeProvider({ children }: PropsWithChildren) {
  // Get device color scheme
  const deviceColorScheme = useNativeColorScheme();
  // State for theme mode - can be 'light', 'dark', or 'black' (admin)
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');

  // Load saved theme preference from storage
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'black')) {
          setThemeMode(savedTheme as ThemeMode);
        } else {
          // Initialize with device preference, defaulting to dark if not available
          setThemeMode(deviceColorScheme === 'dark' || deviceColorScheme === null ? 'dark' : 'light');
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
        // Default to device preference if storage fails
        setThemeMode(deviceColorScheme === 'dark' || deviceColorScheme === null ? 'dark' : 'light');
      }
    };

    loadThemePreference();
  }, [deviceColorScheme]);

  // Save theme preference when it changes
  useEffect(() => {
    const saveThemePreference = async () => {
      try {
        await AsyncStorage.setItem(THEME_STORAGE_KEY, themeMode);
      } catch (error) {
        console.error('Error saving theme preference:', error);
      }
    };

    saveThemePreference();
  }, [themeMode]);

  // Toggle between light and dark mode (excluding black admin mode)
  const toggleTheme = () => {
    setThemeMode((prev) => {
      if (prev === 'black') return 'light'; // If in admin black mode, switch to light
      return prev === 'light' ? 'dark' : 'light'; // Otherwise toggle between light and dark
    });
  };

  // Set a specific theme mode
  const setSpecificThemeMode = (mode: ThemeMode) => {
    setThemeMode(mode);
  };

  // Derived states
  const isDarkMode = themeMode === 'dark' || themeMode === 'black';
  const isAdminMode = themeMode === 'black';

  // Select the appropriate theme based on mode
  const colors = {
    'light': lightTheme,
    'dark': darkTheme,
    'black': blackTheme
  }[themeMode];

  return (
    <ThemeContext.Provider value={{
      themeMode,
      isDarkMode,
      isAdminMode,
      toggleTheme,
      setThemeMode: setSpecificThemeMode,
      colors
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Custom hook to access the theme context
 * @returns The theme context with isDarkMode and toggleTheme
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
