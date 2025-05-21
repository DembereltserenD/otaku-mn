import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import {
  Home,
  Film,
  Users,
  Tag,
  Bell,
  Settings,
  BarChart3,
  Shield,
  LogOut,
} from "lucide-react-native";
import { useTheme } from "@/context/ThemeProvider";
import { useAuth } from "@/context/AuthContext";

interface AdminNavProps {
  variant?: "sidebar" | "bottom";
  onScreenChange?: (screenId: string) => void;
  currentScreen?: string;
}

/**
 * AdminNav component provides consistent navigation across admin pages
 * with visual indication of the current active page.
 */
const AdminNav = ({ 
  variant = "sidebar", 
  onScreenChange, 
  currentScreen = "dashboard" 
}: AdminNavProps) => {
  const router = useRouter();
  const { colors, isDarkMode } = useTheme();
  const { user, signOut, role } = useAuth();

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut();
      router.replace('/');
    } catch (error) {
      console.error('Error logging out:', error);
      Alert.alert('Error', 'Failed to log out. Please try again.');
    }
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "anime", label: "Anime", icon: Film },
    { id: "episodes", label: "Episodes", icon: Film, parent: "anime" },
    { id: "users", label: "Users", icon: Users },
    { id: "genres", label: "Genres", icon: Tag },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "moderation", label: "Moderation", icon: Shield },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const isActive = (id: string) => {
    return id === currentScreen;
  };

  const handleNavPress = (id: string) => {
    if (onScreenChange) {
      onScreenChange(id);
    }
  };

  if (variant === "bottom") {
    return (
      <View style={[styles.bottomNav, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        {navItems.slice(0, 5).map((item) => {
          const IconComponent = item.icon;
          const active = isActive(item.id);
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.bottomNavItem}
              onPress={() => handleNavPress(item.id)}
            >
              <IconComponent size={20} color={active ? colors.primary : colors.inactive} />
              <Text
                style={[
                  styles.bottomNavLabel,
                  { color: active ? colors.primary : colors.inactive }
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  return (
    <View style={[styles.sidebar, { backgroundColor: isDarkMode ? '#1A1F2C' : '#F3F4F6' }]}>
      <View style={styles.sidebarHeader}>
        <View style={styles.logoContainer}>
          <Shield size={24} color={colors.primary} />
          <Text style={[styles.logoText, { color: colors.text }]}>Admin Dashboard</Text>
        </View>
        <TouchableOpacity 
          style={[styles.userActions, { backgroundColor: colors.error + '20' }]} 
          onPress={handleLogout}
        >
          <LogOut size={16} color={colors.error} />
          <Text style={[styles.actionText, { color: colors.error }]}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.navContainer}>
        {navItems.map((item) => {
          // Skip child items, they'll be rendered under their parent
          if (item.parent && !isActive(item.parent) && !isActive(item.id)) {
            return null;
          }
          
          const IconComponent = item.icon;
          const active = isActive(item.id);
          const isChild = !!item.parent;
          
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.navItem,
                isChild && styles.childNavItem,
                active && [styles.activeNavItem, { backgroundColor: `${colors.primary}20` }]
              ]}
              onPress={() => handleNavPress(item.id)}
            >
              <IconComponent 
                size={isChild ? 16 : 20} 
                color={active ? colors.primary : colors.inactive} 
              />
              <Text
                style={[
                  styles.navLabel,
                  isChild && styles.childNavLabel,
                  { color: active ? colors.primary : colors.textSecondary }
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={[styles.sidebarFooter, { borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/")}
        >
          <Home size={20} color={colors.inactive} />
          <Text style={[styles.backText, { color: colors.textSecondary }]}>
            Back to App
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    width: 250,
    height: '100%',
    paddingVertical: 16,
  },
  sidebarHeader: {
    marginBottom: 24,
    paddingHorizontal: 16,
    gap: 12,
  },
  userActions: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    gap: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  navContainer: {
    flex: 1,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 4,
    borderRadius: 8,
  },
  childNavItem: {
    paddingLeft: 40,
    paddingVertical: 8,
    marginBottom: 2,
  },
  activeNavItem: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  navLabel: {
    marginLeft: 12,
    fontSize: 15,
  },
  childNavLabel: {
    fontSize: 13,
  },
  sidebarFooter: {
    borderTopWidth: 1,
    paddingTop: 16,
    marginTop: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  backText: {
    marginLeft: 12,
    fontSize: 15,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  bottomNavItem: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  bottomNavLabel: {
    fontSize: 12,
    marginTop: 4,
  },
});

export default AdminNav;
