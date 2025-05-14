import React, { useEffect } from "react";
import { View, StatusBar, Platform } from "react-native";
import { Slot, usePathname } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ThemeProvider, useTheme } from "@/context/ThemeProvider";
import { ToastProvider } from "@/context/ToastContext";
import { MoodMatcherProvider } from "@/context/MoodMatcherProvider";
import AuthProvider from "@/context/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import BottomNavigation from "@/components/BottomNavigation";
import ErrorHandler from "@/components/ErrorHandler";
import { useAuth } from "@/context/AuthContext";

/**
 * Root layout component that wraps the entire application
 * with necessary providers and configuration
 */
export default function RootLayout() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <MoodMatcherProvider>
              <RootLayoutContent />
            </MoodMatcherProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

/**
 * Content component for the root layout that applies theme
 * and renders the main application content
 */
function RootLayoutContent() {
  const { colors } = useTheme();
  const pathname = usePathname();
  const { user } = useAuth();

  console.log('RootLayoutContent user:', user);

  // Set status bar style based on theme
  useEffect(() => {
    StatusBar.setBarStyle("light-content");
    StatusBar.setBackgroundColor(colors.background);
  }, [colors]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingBottom: Platform.OS === 'ios' ? 80 : 60 // Add padding to account for bottom navigation
      }}>
        <Slot />
        <BottomNavigation currentRoute={pathname} />
        <ErrorHandler />
      </View>
    </GestureHandlerRootView>
  );
}
