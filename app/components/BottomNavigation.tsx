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
import { Home, Heart, User, Search, BookOpen, Shield, BarChart3, Settings } from "lucide-react-native";
import { useTheme } from "@/context/ThemeProvider";
import { useAuth } from "@/context/AuthContext";

interface NavItem {
  name: string;
  href: string;
  icon: typeof Home;
  activeIcon?: typeof Home;
}

interface AdminNavItem {
  id: string;
  label: string;
  icon: typeof Home;
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
  // Admin-specific props
  isAdminView?: boolean;
  adminItems?: AdminNavItem[];
  activeAdminItemId?: string;
  onAdminItemClick?: (itemId: string) => void;
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
  isAdminView = false,
  adminItems = [],
  activeAdminItemId,
  onAdminItemClick,
}: BottomNavigationProps = {}) {
  const { user, role } = useAuth();
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

  // Filter navItems based on user role
  let filteredNavItems = navItems.filter((item) => {
    // For admin users, only show Search and Admin tabs
    if (role === 'admin') {
      return item.name === 'Search';
    }
    // For regular users, hide Library if not logged in
    return item.name !== 'Library' || !!user;
  });
  if (user) {
    // For admin users, only add Admin tab
    if (role === 'admin') {
      filteredNavItems.push({ name: "Admin", href: "/admin", icon: Shield });
    } else {
      // For regular users, add Profile tab
      filteredNavItems.push({ name: "Profile", href: "/profile", icon: User });
    }
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

  // If in admin view, render admin navigation
  if (isAdminView && adminItems.length > 0) {
    return (
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: '#0F172A', // Dark blue background for admin
            borderTopColor: colors.border,
            height: 70, // Taller height for horizontal layout
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
        accessibilityLabel="Admin bottom navigation"
      >
        <SafeAreaView style={styles.adminNavContainer}>
        {adminItems.map((item) => {
          const isActive = item.id === activeAdminItemId;
          const IconComponent = item.icon;
          
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.adminTabItem}
              onPress={() => onAdminItemClick?.(item.id)}
              accessibilityRole="button"
              accessibilityLabel={item.label}
            >
              {isActive && (
                <View
                  style={[
                    styles.adminTabIndicator,
                    {
                      backgroundColor: '#10B981',
                    },
                  ]}
                />
              )}
              <View style={isActive ? styles.adminActiveIconContainer : styles.adminIconContainer}>
                <IconComponent
                  size={22}
                  color={isActive ? colors.card : colors.inactive}
                />
              </View>
              <Text
                style={[
                  styles.adminTabLabel,
                  {
                    color: isActive ? colors.primary : colors.inactive,
                    marginLeft: 8,
                  },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
        </SafeAreaView>
      </Animated.View>
    );
  }
  
  // Regular user navigation
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
  // Admin specific styles
  adminNavContainer: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-around",
    paddingBottom: Platform.OS === "ios" ? 20 : 8,
  },
  adminTabItem: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    position: "relative",
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginHorizontal: 4,
  },
  adminTabIndicator: {
    position: "absolute",
    left: 0,
    width: 3,
    height: '100%',
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },
  adminTabLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  adminIconContainer: {
    padding: 8,
    marginRight: 8,
  },
  adminActiveIconContainer: {
    backgroundColor: '#10B981',
    padding: 8,
    borderRadius: 20,
    marginRight: 8,
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
