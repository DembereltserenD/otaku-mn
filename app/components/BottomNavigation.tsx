import React, { useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  Dimensions,
  SafeAreaView,
} from "react-native";
import { useRouter, usePathname } from "expo-router";
import { Home, Heart, User, Search, BookOpen } from "lucide-react-native";
import { useTheme } from "@/context/ThemeProvider";
import { useAuth } from "@/context/AuthContext";

interface NavItem {
  name: string;
  href: string;
  icon: typeof Home;
  activeIcon?: typeof Home;
}

const navItems: NavItem[] = [
  { name: "Home", href: "/", icon: Home },
  { name: "Search", href: "/search", icon: Search },
  { name: "Library", href: "/library", icon: BookOpen },
  // Profile or Sign In tab will be conditionally added below
];

interface BottomNavigationProps {
  currentRoute?: string;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

/**
 * BottomNavigation component provides app-wide navigation
 * with home, search, library and profile options
 *
 * @returns BottomNavigation component with active state indicators and animations
 */
const BottomNavigation = React.memo(function BottomNavigation({
  currentRoute,
  activeTab,
  onTabChange,
}: BottomNavigationProps = {}) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { colors, isDarkMode } = useTheme();

  // Animation references for tab indicators
  const tabAnimationsRef = useRef<Animated.Value[]>([]);
  // Animation for the entire bar
  const barAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(barAnimation, {
      toValue: 1,
      tension: 40,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  // Use provided currentRoute or determine from pathname
  const activeRoute = currentRoute || pathname;

  // Filter navItems to hide Library if not logged in
  let filteredNavItems = navItems.filter(
    (item) => item.name !== "Library" || !!user
  );
  if (user) {
    filteredNavItems.push({ name: "Profile", href: "/profile", icon: User });
  } else {
    filteredNavItems.push({ name: "Sign In", href: "/login", icon: User });
  }

  // Animation references for tab indicators
  if (tabAnimationsRef.current.length !== filteredNavItems.length) {
    tabAnimationsRef.current = filteredNavItems.map(() => new Animated.Value(0));
  }
  const tabAnimations = tabAnimationsRef.current;

  // Handle tab press with animation and haptic feedback
  const handleTabPress = useCallback(
    (route: string, index: number) => {
      // Add haptic feedback
      try {
        const Haptics = require("expo-haptics");
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (error) {
        // Haptics not available, continue silently
      }

      // Animate pressed tab
      Animated.sequence([
        Animated.timing(tabAnimations[index], {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(tabAnimations[index], {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      // Navigate to the route
      router.push(route);
      onTabChange?.(route);
    },
    [router, onTabChange, tabAnimations],
  );

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          shadowColor: isDarkMode ? "rgba(0, 0, 0, 0.5)" : "rgba(0, 0, 0, 0.2)",
          transform: [
            {
              translateY: barAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [100, 0],
              }),
            },
          ],
        },
      ]}
      accessibilityRole="tablist"
      accessibilityLabel="Bottom navigation"
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.tabRow}>
          {filteredNavItems.map((item, index) => {
            const isActive = activeRoute === item.href;
            const Icon = item.icon;

            // Scale animation for the tab
            const scale = tabAnimations[index].interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [1, 0.9, 1],
            });

            return (
              <Animated.View
                key={item.name}
                style={[
                  styles.tabContainer,
                  {
                    transform: [{ scale }],
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.tabButton}
                  onPress={() => handleTabPress(item.href, index)}
                  activeOpacity={0.7}
                  accessibilityRole="tab"
                  accessibilityLabel={item.name}
                  accessibilityState={{ selected: isActive }}
                  accessibilityHint={`Navigate to ${item.name}`}
                >
                  <View style={styles.tabContent}>
                    <View
                      style={[
                        styles.iconContainer,
                        isActive && styles.activeIconContainer,
                      ]}
                    >
                      <Icon
                        size={22}
                        color={isActive ? colors.primary : colors.inactive}
                        strokeWidth={isActive ? 2.5 : 2}
                      />
                    </View>
                    <Text
                      style={[
                        styles.tabLabel,
                        {
                          color: isActive ? colors.primary : colors.inactive,
                          fontWeight: isActive ? "600" : "400",
                          opacity: isActive ? 1 : 0.8,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                  </View>

                  {isActive && (
                    <Animated.View
                      style={[
                        styles.activeIndicator,
                        { backgroundColor: colors.primary },
                      ]}
                    />
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      </SafeAreaView>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    elevation: 8,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    zIndex: 9999,
  },
  safeArea: {
    width: "100%",
  },
  tabRow: {
    flexDirection: "row",
    paddingBottom: Platform.OS === "ios" ? 20 : 8,
    paddingTop: 8,
  },
  tabContainer: {
    flex: 1,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    paddingVertical: 4,
  },
  tabContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    marginBottom: 2,
  },
  activeIconContainer: {
    backgroundColor: "rgba(99, 102, 241, 0.1)", // Primary color with opacity
  },
  tabLabel: {
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
    marginTop: 0,
  },
  activeIndicator: {
    position: "absolute",
    bottom: 0,
    height: 3,
    width: "30%",
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
});

export default BottomNavigation;
